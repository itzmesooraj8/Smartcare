import logging
import sys
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import jwt
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

# Core Imports
from app.core.config import settings
from app.database import engine, get_db, Base
from app.models.user import User

# Signaling / Module Imports
from app import signaling as signaling_module
from app.api.v1 import (
    dashboard as dashboard_module,
    appointments as appointments_module,
    medical_records as medical_records_module,
    tele as tele_module,
    admin as admin_module,
    files as files_module,
    video as video_module,
    mfa as mfa_module,
    vault as vault_module,
    protected_key as protected_key_module,
    auth as auth_module,
    mfa_recovery as mfa_recovery_module
)

# --- SECURITY CONFIGURATION ---
pwd_context = CryptContext(schemes=["bcrypt"], bcrypt__rounds=12, deprecated="auto")
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Logging Setup
logger = logging.getLogger("smartcare")
logging.basicConfig(level=logging.INFO)

# 🚀 INITIALIZE APP
app = FastAPI(title="SmartCare Backend")

# --- CORS CONFIGURATION ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["set-cookie"],
)

# --- RATE LIMITER SETUP ---
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(status_code=429, content={"detail": "Too many requests. Try again later."})

# --- DATABASE STARTUP ---
@app.on_event("startup")
async def startup_event():
    logger.info("SmartCare Backend starting")
    Base.metadata.create_all(bind=engine)
    logger.info("Database initialized")

# --- UTILS ---
def create_access_token(subject: str, role: Optional[str] = None) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": subject, "exp": expire}
    if role:
        to_encode["role"] = role
    return jwt.encode(to_encode, settings.PRIVATE_KEY, algorithm="RS256")

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

# --- LOGIN LOGIC ---
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@limiter.limit("5/minute")
@app.post("/api/v1/auth/login")
def login(request: Request, payload: LoginRequest, db=Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    role = getattr(user, 'role', 'patient')
    
    # 🛡️ MFA SECURITY CHECK
    if role == 'doctor' and not getattr(user, 'mfa_totp_secret', None):
        raise HTTPException(status_code=428, detail="MFA_SETUP_REQUIRED")

    token = create_access_token(subject=str(user.id), role=role)

    response = JSONResponse(content={
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": getattr(user, 'full_name', None),
            "role": role,
        }
    })
    
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path='/'
    )
    return response

@app.post("/api/v1/auth/logout")
def logout():
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie("access_token", path='/', domain=None)
    return response

# --- ROUTER REGISTRATION ---
app.include_router(signaling_module.router)
app.include_router(dashboard_module.router, prefix="/api/v1/patient")
app.include_router(appointments_module.router, prefix="/api/v1/appointments")
app.include_router(medical_records_module.router, prefix="/api/v1/medical-records")
app.include_router(tele_module.router, prefix="/api/v1/tele")
app.include_router(admin_module.router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(files_module.router, prefix="/api/v1/files", tags=["Files"])
app.include_router(video_module.router, prefix="/api/v1/video", tags=["Video"])
app.include_router(mfa_module.router, prefix="/api/v1/mfa", tags=["MFA"])
app.include_router(vault_module.router, prefix="/api/v1/vault", tags=["Vault"])
app.include_router(protected_key_module.router, prefix="/api/v1/keys", tags=["Keys"])
app.include_router(auth_module.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(mfa_recovery_module.router, prefix="/api/v1/mfa/recovery", tags=["MFA-Recovery"])

@app.get("/")
def root():
    return {"status": "online", "service": "SmartCare Backend"}