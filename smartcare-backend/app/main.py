from datetime import datetime, timedelta
from typing import Optional
import uuid

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import jwt

from app.core.config import settings
from app.services.chatbot import ChatbotService
from app import signaling as signaling_module
from app.api.v1 import dashboard as dashboard_module
from app.api.v1 import appointments as appointments_module
from app.api.v1 import medical_records as medical_records_module
from app.api.v1 import tele as tele_module

from app.database import engine, get_db, Base
from app.models.user import User


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ACCESS_TOKEN_EXPIRE_MINUTES = 60

app = FastAPI(title="SmartCare Backend")

# Explicit Origins (Render + Vercel)
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://smartcare-zflo.onrender.com",
    "https://smartcare-six.vercel.app",
    "https://smartcare-frontend.vercel.app",
    "https://www.smartcare-six.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(signaling_module.router)
app.include_router(dashboard_module.router, prefix="/api/v1/patient")
app.include_router(appointments_module.router, prefix="/api/v1/appointments")
app.include_router(medical_records_module.router, prefix="/api/v1/medical-records")
app.include_router(tele_module.router, prefix="/api/v1/tele")
    
@app.get("/api/v1/doctors")
def list_doctors(db=Depends(get_db)):
    # Return basic doctor info; safe-guard missing fields with defaults
    doctors = db.query(User).filter(User.role == 'doctor').all()
    result = []
    for d in doctors:
        result.append({
            "id": d.id,
            "full_name": getattr(d, 'full_name', getattr(d, 'email', None)),
            "specialization": getattr(d, 'specialization', 'General'),
        })
    return result


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


class ChatRequest(BaseModel):
    message: str


@app.on_event("startup")
async def ensure_tables_and_listeners():
    print("🏗️ Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created successfully.")
    # Start Redis listener for signaling if configured
    try:
        if getattr(settings, "REDIS_URL", None):
            import asyncio as _asyncio
            _asyncio.create_task(signaling_module.manager.start_redis_listener())
            print("🔁 Redis signaling listener started")
    except Exception as e:
        print("⚠️ Failed to start Redis listener:", e)


def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = {"sub": subject}
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


@app.get("/health")
def health():
    return {"status": "ok", "mode": "serverless"}


# TEMPORARY: Promote a user to doctor by email. Remove after use.
@app.get("/promote-doctor")
def promote_doctor(email: str, db=Depends(get_db)):
    from sqlalchemy import text
    q = text("UPDATE users SET role = 'doctor' WHERE email = :email")
    try:
        db.execute(q, {"email": email})
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    return {"status": "promoted", "email": email}


@app.post("/api/v1/chat")
async def chat_endpoint(payload: ChatRequest):
    resp = await ChatbotService.get_response(payload.message)
    return {"response": resp}


@app.post("/api/v1/auth/register", status_code=201)
def register(payload: RegisterRequest, db=Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    hashed = get_password_hash(payload.password)
    new_user = User(email=payload.email, hashed_password=hashed, full_name=payload.full_name)
    db.add(new_user)
    try:
        db.commit()
        db.refresh(new_user)
    except Exception:
        db.rollback()
        raise

    return {
        "id": new_user.id,
        "email": new_user.email,
        "full_name": new_user.full_name,
        "is_active": bool(new_user.is_active),
        "created_at": new_user.created_at.isoformat() if getattr(new_user, 'created_at', None) else datetime.utcnow().isoformat(),
    }


@app.post("/api/v1/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db=Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(subject=str(user.id))
    return {"access_token": token, "token_type": "bearer"}
