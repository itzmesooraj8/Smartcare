from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import jwt
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.core.config import settings
from app.services.chatbot import ChatbotService
from app import signaling as signaling_module
from app.api.v1 import dashboard as dashboard_module
from app.api.v1 import appointments as appointments_module
from app.api.v1 import medical_records as medical_records_module
from app.api.v1 import tele as tele_module
from app.api.v1 import admin as admin_module
from app.api.v1 import files as files_module

from app.database import engine, get_db, Base
from app.models.user import User

# --- SECURITY CONFIGURATION ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
ACCESS_TOKEN_EXPIRE_MINUTES = 60

app = FastAPI(title="SmartCare Backend")

# --- RATE LIMITER ---
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)


def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        {"detail": getattr(exc, "detail", "Rate limit exceeded. Please try again later.")},
        status_code=429,
    )


app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# --- CORS (dynamic from settings) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=getattr(settings, "ALLOWED_ORIGINS", ["http://localhost:5173", "http://localhost:3000"]),
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

# --- SHARED SCHEMAS ---
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class ChatRequest(BaseModel):
    message: str

# --- EVENTS ---
@app.on_event("startup")
async def startup_event():
    print("🚀 SmartCare Backend Starting...")
    print("🏗️  Verifying database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Database connection established.")
    
    # Start Redis listener for signaling if configured
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

# --- AUTH ENDPOINTS ---
@limiter.limit("5/minute")
@app.post("/api/v1/auth/register", status_code=201)
def register(payload: RegisterRequest, db=Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        email=payload.email, 
        hashed_password=get_password_hash(payload.password), 
        full_name=payload.full_name,
        role="patient" # Default role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"id": new_user.id, "email": new_user.email, "message": "Registration successful"}

@limiter.limit("5/minute")
@app.post("/api/v1/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db=Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Use stored role in DB or default to 'patient'
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
    }
