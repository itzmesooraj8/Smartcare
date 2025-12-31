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
from app.database import engine, get_db, Base, SessionLocal
from app.models.user import User
from app.models.audit_log import AuditLog

# Router Imports
from app.api.v1 import (
    dashboard as dashboard_module,
    appointments as appointments_module,
    medical_records as medical_records_module,
    files as files_module,
    auth as auth_module
)
from app import signaling as signaling_module

# Switch to bcrypt as it is more guaranteed to be available than argon2 on some environments
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
ACCESS_TOKEN_EXPIRE_MINUTES = getattr(settings, "ACCESS_TOKEN_EXPIRE_MINUTES", 15)
logger = logging.getLogger("smartcare")

app = FastAPI(title="SmartCare Backend")

# --- CORS SETTINGS ---
# Use configured BACKEND_CORS_ORIGINS from settings to allow preview and local domains.
ORIGINS = list(getattr(settings, 'BACKEND_CORS_ORIGINS', []))

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


@app.middleware("http")
async def audit_sensitive_reads(request: Request, call_next):
    """
    Lightweight middleware to record read access to sensitive resources.
    We persist a minimal AuditLog entry for GETs to the medical-records API.
    """
    response = await call_next(request)
    try:
        if request.method == 'GET' and request.url.path.startswith('/api/v1/medical-records'):
            user_id = getattr(request.state, 'current_user_id', None)
            if user_id:
                db = SessionLocal()
                try:
                    audit = AuditLog(user_id=str(user_id), target_id=None, action='READ', resource_type='MEDICAL_RECORDS', ip_address=(request.client.host if request.client else None))
                    db.add(audit)
                    db.commit()
                except Exception:
                    db.rollback()
                finally:
                    db.close()
    except Exception:
        # Never fail the request due to auditing issues
        pass

    return response

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global Crash: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error": str(exc)},
        headers={
            "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        },
    )

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