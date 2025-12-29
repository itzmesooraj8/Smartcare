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

pwd_context = CryptContext(schemes=["bcrypt"], bcrypt__rounds=12)
ACCESS_TOKEN_EXPIRE_MINUTES = 60
logger = logging.getLogger("smartcare")

app = FastAPI(title="SmartCare Backend")

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