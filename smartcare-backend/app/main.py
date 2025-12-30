import logging
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import jwt, JWTError
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from app.core.config import settings
from app.database import engine, get_db, Base
from app.models.user import User

# Router Imports
from app.api.v1 import (
    dashboard as dashboard_module,
    appointments as appointments_module,
    medical_records as medical_records_module,
    files as files_module,
    auth as auth_module
)
from app import signaling as signaling_module

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
ACCESS_TOKEN_EXPIRE_MINUTES = getattr(settings, "ACCESS_TOKEN_EXPIRE_MINUTES", 15)
logger = logging.getLogger("smartcare")

app = FastAPI(title="SmartCare Backend")

# --- STRICT CORS SETTINGS FOR PRODUCTION ---
# explicitly strictly allowing ONLY your production frontend
ORIGINS = [
    "https://smartcare-six.vercel.app",
    "https://smartcare-six.vercel.app/",  # Handle trailing slash variations
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def inject_current_user(request: Request, call_next):
    """
    Decodes the JWT from the Authorization Header (Priority) or Cookie (Fallback).
    For Vercel->Render deployment, Authorization Header is the only reliable method.
    """
    request.state.current_user_id = None
    token = None

    # 1. Priority: Check Authorization: Bearer <token>
    auth = request.headers.get("Authorization")
    if auth and auth.lower().startswith("bearer "):
        token = auth.split(" ", 1)[1]

    # 2. Fallback: Check Cookie (often blocked in cross-site)
    if not token:
        try:
            token = request.cookies.get("access_token")
        except Exception:
            pass

    if token:
        try:
            payload = jwt.decode(token, settings.PUBLIC_KEY, algorithms=["RS256"])
            sub = payload.get("sub")
            if sub:
                request.state.current_user_id = str(sub)
        except Exception:
            request.state.current_user_id = None

    response = await call_next(request)
    return response

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

@app.on_event("startup")
async def startup_event():
    Base.metadata.create_all(bind=engine)

# --- ROUTER REGISTRATION ---
app.include_router(signaling_module.router)
app.include_router(auth_module.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(dashboard_module.router, prefix="/api/v1/patient", tags=["Dashboard"])
app.include_router(medical_records_module.router, prefix="/api/v1/medical-records", tags=["Records"])
app.include_router(files_module.router, prefix="/api/v1/files", tags=["Files"])
app.include_router(appointments_module.router, prefix="/api/v1/appointments", tags=["Appointments"])

@app.get("/")
def root():
    return {"status": "online", "environment": "production"}