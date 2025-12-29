import logging
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import jwt
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
# Signaling lives at app/signaling.py
from app import signaling as signaling_module

# Use Argon2 for password hashing to avoid bcrypt 72-byte limit and DoS risk
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
# Use application settings for token TTL; config enforces a conservative maximum (<=15)
ACCESS_TOKEN_EXPIRE_MINUTES = getattr(settings, "ACCESS_TOKEN_EXPIRE_MINUTES", 15)
logger = logging.getLogger("smartcare")

app = FastAPI(title="SmartCare Backend")


@app.middleware("http")
async def inject_current_user(request: Request, call_next):
    """Decode the incoming JWT (cookie or Authorization header) and set
    `request.state.current_user_id` for use by DB session dependency so
    Postgres RLS policies can use `current_setting('app.current_user_id')`.
    """
    request.state.current_user_id = None
    token = None
    # Prefer HttpOnly cookie named `access_token` set by login
    try:
        token = request.cookies.get("access_token")
    except Exception:
        token = None

    # Fallback: Authorization: Bearer <token>
    if not token:
        auth = request.headers.get("Authorization")
        if auth and auth.lower().startswith("bearer "):
            token = auth.split(" ", 1)[1]

    if token:
        try:
            payload = jwt.decode(token, settings.PUBLIC_KEY, algorithms=["RS256"])
            sub = payload.get("sub")
            if sub:
                request.state.current_user_id = str(sub)
        except Exception:
            # Do not raise here; leave current_user_id as None
            request.state.current_user_id = None

    response = await call_next(request)
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

@app.on_event("startup")
async def startup_event():
    Base.metadata.create_all(bind=engine)

def create_access_token(subject: str, role: Optional[str] = None) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": subject, "exp": expire}
    if role: to_encode["role"] = role
    return jwt.encode(to_encode, settings.PRIVATE_KEY, algorithm="RS256")

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)



# --- ROUTER REGISTRATION ---
# 1. Signaling (Usually no prefix or specific one)
app.include_router(signaling_module.router)

# 2. Auth (CRITICAL: This is where login/logout live)
# If your auth.py router already has prefix="/api/v1/auth", don't double it.
app.include_router(auth_module.router, prefix="/api/v1/auth", tags=["Auth"])

# 3. Patient Dashboard
app.include_router(dashboard_module.router, prefix="/api/v1/patient", tags=["Dashboard"])

# 4. Medical Records
app.include_router(medical_records_module.router, prefix="/api/v1/medical-records", tags=["Records"])

# 5. Files
app.include_router(files_module.router, prefix="/api/v1/files", tags=["Files"])

# 6. Appointments
app.include_router(appointments_module.router, prefix="/api/v1/appointments", tags=["Appointments"])

@app.get("/")
def root():
    return {"status": "online"}