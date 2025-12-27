from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import jwt
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import settings
from app.services.chatbot import ChatbotService
from app import signaling as signaling_module
from app.api.v1 import dashboard as dashboard_module
from app.api.v1 import appointments as appointments_module
from app.api.v1 import medical_records as medical_records_module
from app.api.v1 import tele as tele_module
from app.api.v1 import admin as admin_module
from app.api.v1 import files as files_module
from app.api.v1 import video as video_module  # <--- ADD THIS

from app.database import engine, get_db, Base
from app.models.user import User

# --- SECURITY CONFIGURATION ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
ACCESS_TOKEN_EXPIRE_MINUTES = 60

app = FastAPI(title="SmartCare Backend")

# --- GLOBAL USER IP FIX ---
# On Render, the real IP is in the 'x-forwarded-for' header.
# If we don't use this, everyone shares the same IP and gets blocked together.
def get_real_ip(request: Request):
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0]
    return request.client.host

# --- RATE LIMITER ---
# Use get_real_ip so users from all over the world have separate limits
limiter = Limiter(key_func=get_real_ip) 
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

# Custom Handler (Fixes the ImportError crash)
def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please try again later."},
    )

app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# --- CORS (Allow Vercel Access) ---
# 🔒 PRODUCTION ONLY CONFIGURATION
origins = [
    "https://smartcare-six.vercel.app",
    "https://smartcare-six.vercel.app/"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # Only allow Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ROUTER REGISTRATION ---
app.include_router(signaling_module.router)
app.include_router(dashboard_module.router, prefix="/api/v1/patient")
app.include_router(appointments_module.router, prefix="/api/v1/appointments")
app.include_router(medical_records_module.router, prefix="/api/v1/medical-records")
app.include_router(tele_module.router, prefix="/api/v1/tele")
app.include_router(admin_module.router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(files_module.router, prefix="/api/v1/files", tags=["Files"])
app.include_router(video_module.router, prefix="/api/v1/video", tags=["Video"]) # <--- ADD THIS

# --- SHARED SCHEMAS ---
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    # Wrapped master key fields (stored server-side but encrypted)
    encrypted_master_key: Optional[str] = None
    key_encryption_iv: Optional[str] = None
    key_derivation_salt: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict
    # Optional key blob returned to the client on login
    key_data: Optional[dict] = None

class ChatRequest(BaseModel):
    message: str

# --- EVENTS ---
@app.on_event("startup")
async def startup_event():
    print("🚀 SmartCare Backend Starting...")
    print("🏗️  Verifying database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Database connection established.")
    
    if getattr(settings, "REDIS_URL", None):
        try:
            import asyncio
            asyncio.create_task(signaling_module.manager.start_redis_listener())
            print("🔁 Redis signaling listener active")
        except Exception as e:
            print(f"⚠️ Redis Warning: {e}")

# --- UTILITIES ---
def create_access_token(subject: str, role: Optional[str] = None, email: Optional[str] = None) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": subject, "exp": expire}
    if role:
        to_encode["role"] = role
    if email:
        to_encode["email"] = email
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# --- PUBLIC ENDPOINTS ---
@app.get("/health")
def health_check():
    return {"status": "ok", "service": "SmartCare API", "version": "1.0.0"}

@app.get("/")
def root():
    return {"status": "online"}

@app.post("/api/v1/chat")
async def chat_endpoint(payload: ChatRequest):
    resp = await ChatbotService.get_response(payload.message)
    return {"response": resp}

@app.get("/api/v1/doctors")
def list_doctors(db=Depends(get_db)):
    doctors = db.query(User).filter(User.role == 'doctor').all()
    return [{
        "id": d.id,
        "full_name": getattr(d, 'full_name', d.email),
        "specialization": getattr(d, 'specialization', 'General Specialist'),
    } for d in doctors]

# --- AUTH ENDPOINTS (FIXED) ---

@limiter.limit("5/minute")
@app.post("/api/v1/auth/register", status_code=201)
# CRITICAL FIX: Added 'request: Request'. This prevents the crash.
def register(request: Request, payload: RegisterRequest, db=Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
        role="patient",
        encrypted_master_key=payload.encrypted_master_key,
        key_encryption_iv=payload.key_encryption_iv,
        key_derivation_salt=payload.key_derivation_salt,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"id": new_user.id, "email": new_user.email, "message": "Registration successful"}

@limiter.limit("5/minute")
@app.post("/api/v1/auth/login", response_model=TokenResponse)
# CRITICAL FIX: Added 'request: Request'. This prevents the crash.
def login(request: Request, payload: LoginRequest, db=Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    role = getattr(user, 'role', 'patient')
    token = create_access_token(subject=str(user.id), role=role, email=user.email)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": getattr(user, 'full_name', None),
            "role": role,
        },
        "key_data": {
            "encrypted_master_key": getattr(user, 'encrypted_master_key', None),
            "key_encryption_iv": getattr(user, 'key_encryption_iv', None),
            "key_derivation_salt": getattr(user, 'key_derivation_salt', None),
        }
    }