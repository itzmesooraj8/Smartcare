import logging
import sys
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import jwt
import hashlib
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

# Core Imports
from app.core.config import settings
from app.database import engine, get_db, Base
from app.models.user import User
from app.models.vault_entry import VaultEntry
from app.models.audit_log import AuditLog

# Services & Routers
from app.services.chatbot import ChatbotService
from app import signaling as signaling_module
from app.api.v1 import dashboard as dashboard_module
from app.api.v1 import appointments as appointments_module
from app.api.v1 import medical_records as medical_records_module
from app.api.v1 import tele as tele_module
from app.api.v1 import admin as admin_module
from app.api.v1 import files as files_module
from app.api.v1 import video as video_module
from app.api.v1 import mfa as mfa_module
from app.api.v1 import vault as vault_module
from app.api.v1 import protected_key as protected_key_module
from app.api.v1 import auth as auth_module
from app.api.v1 import mfa_recovery as mfa_recovery_module

# --- SECURITY CONFIGURATION ---
pwd_context = CryptContext(schemes=["bcrypt"], bcrypt__rounds=12, deprecated="auto")
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Logging Setup
logger = logging.getLogger("smartcare")
logging.basicConfig(level=logging.INFO)

# 🚀 INITIALIZE APP (ONCE)
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
def get_client_ip(request: Request):
    forwarded = request.headers.get("x-forwarded-for")
    peer = request.client.host
    trusted = getattr(settings, 'TRUSTED_PROXIES', []) or []
    if forwarded and peer in trusted:
        return forwarded.split(",")[0].strip()
    return peer

limiter = Limiter(key_func=get_client_ip)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(status_code=429, content={"detail": "Too many requests. Try again later."})

app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# --- EXCEPTION HANDLERS ---
@app.on_event("startup")
async def startup_event():
    logger.info("SmartCare Backend starting")
    
    # 1. Secret Sanity Check
    missing = []
    if not getattr(settings, 'PRIVATE_KEY', None): missing.append('PRIVATE_KEY')
    if not getattr(settings, 'ENCRYPTION_KEY', None): missing.append('ENCRYPTION_KEY')
    
    if missing:
        logger.critical(f"FATAL: Missing required secrets: {', '.join(missing)}")
        raise SystemExit(1)

    # 2. Database Init
    logger.info('Verifying database tables...')
    Base.metadata.create_all(bind=engine)
    logger.info('Database connection established')

    # 3. Redis Init (Optional)
    if getattr(settings, "REDIS_URL", None):
        try:
            import asyncio
            asyncio.create_task(signaling_module.manager.start_redis_listener())
            logger.info('Redis signaling listener active')
        except Exception:
            logger.warning('Redis listener failed to start')

# --- UTILS ---
def create_access_token(subject: str, role: Optional[str] = None) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": subject, "exp": expire}
    if role:
        to_encode["role"] = role
    return jwt.encode(to_encode, settings.PRIVATE_KEY, algorithm="RS256")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

# --- SHARED SCHEMAS ---
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# --- AUTH ENDPOINTS ---
@limiter.limit("5/minute")
@app.post("/api/v1/auth/login")
def login(request: Request, payload: LoginRequest, db=Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    role = getattr(user, 'role', 'patient')
    
    # 🛡️ SECURITY FIX: MFA Grace Period REMOVED.
    # Doctors MUST have MFA active to log in. No exceptions.
    if role == 'doctor' and not getattr(user, 'mfa_totp_secret', None):
        # Return 428 Precondition Required to trigger frontend setup flow
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
    
    # Secure Cookie
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
import logging
import sys
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import jwt
import hashlib
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

# Core Imports
from app.core.config import settings
from app.database import engine, get_db, Base
from app.models.user import User
from app.models.vault_entry import VaultEntry
from app.models.audit_log import AuditLog

    token = create_access_token(subject=str(user.id), role=role)

    response = JSONResponse(content={
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": getattr(user, 'full_name', None),
            "role": role,
        }
    })
    
    # Secure Cookie
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


    def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
        return JSONResponse(status_code=429, content={"detail": "Too many requests. Try again later."})

    app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

    # --- EXCEPTION HANDLERS ---
    @app.on_event("startup")
    async def startup_event():
        logger.info("SmartCare Backend starting")
    
        # 1. Secret Sanity Check
        missing = []
        if not getattr(settings, 'PRIVATE_KEY', None): missing.append('PRIVATE_KEY')
        if not getattr(settings, 'ENCRYPTION_KEY', None): missing.append('ENCRYPTION_KEY')
    
        if missing:
            logger.critical(f"FATAL: Missing required secrets: {', '.join(missing)}")
            raise SystemExit(1)

        # 2. Database Init
        logger.info('Verifying database tables...')
        Base.metadata.create_all(bind=engine)
        logger.info('Database connection established')

        # 3. Redis Init (Optional)
        if getattr(settings, "REDIS_URL", None):
            try:
                import asyncio
                asyncio.create_task(signaling_module.manager.start_redis_listener())
                logger.info('Redis signaling listener active')
            except Exception:
                logger.warning('Redis listener failed to start')

    # --- UTILS ---
    def create_access_token(subject: str, role: Optional[str] = None) -> str:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode = {"sub": subject, "exp": expire}
        if role:
            to_encode["role"] = role
        return jwt.encode(to_encode, settings.PRIVATE_KEY, algorithm="RS256")

    def get_password_hash(password: str) -> str:
        return pwd_context.hash(password)

    def verify_password(plain: str, hashed: str) -> bool:
        return pwd_context.verify(plain, hashed)

    # --- SHARED SCHEMAS ---
    class LoginRequest(BaseModel):
        email: EmailStr
        password: str

    # --- AUTH ENDPOINTS ---
    @limiter.limit("5/minute")
    @app.post("/api/v1/auth/login")
    def login(request: Request, payload: LoginRequest, db=Depends(get_db)):
        user = db.query(User).filter(User.email == payload.email).first()
        if not user or not verify_password(payload.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        role = getattr(user, 'role', 'patient')
    
        # 🛡️ SECURITY FIX: MFA Grace Period REMOVED.
        # Doctors MUST have MFA active to log in. No exceptions.
        if role == 'doctor' and not getattr(user, 'mfa_totp_secret', None):
            # Return 428 Precondition Required to trigger frontend setup flow
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
    
        # Secure Cookie
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