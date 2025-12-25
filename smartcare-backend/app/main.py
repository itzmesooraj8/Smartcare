from datetime import datetime, timedelta
from datetime import datetime, timedelta
from typing import Optional, Union
import uuid  # <--- CRITICAL IMPORT

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi import APIRouter
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import jwt
from sqlalchemy import text

from app.core.config import settings
from app.services.chatbot import ChatbotService
from app import signaling as signaling_module
from app.api.v1 import dashboard as dashboard_module
from app.api.v1 import appointments as appointments_module
from app.api.v1 import medical_records as medical_records_module

# FIX: Import Base and Models for Auto-Creation
from app.database import engine, get_db, Base
from app.models.user import User
from app.models.appointment import Appointment
from app.models.medical_record import MedicalRecord

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ACCESS_TOKEN_EXPIRE_MINUTES = 60

app = FastAPI(title="SmartCare Backend")

# FIX: Explicit Origins (Render + Vercel)
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://smartcare-zflo.onrender.com",
    "https://smartcare-six.vercel.app",
    "https://smartcare-six.vercel.app/",
    "https://www.smartcare-six.vercel.app"
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


# FIX: Auto-Create Tables (Robust)
@app.on_event("startup")
def ensure_tables():
    print("🏗️ Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created successfully.")


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


@app.post("/api/v1/chat")
async def chat_endpoint(payload: ChatRequest):
    # Note: Frontend handles 429 errors gracefully
    resp = await ChatbotService.get_response(payload.message)
    return {"response": resp}


# FIX: Register with UUID and No RETURNING Clause
@app.post("/api/v1/auth/register", status_code=201)
def register(payload: RegisterRequest, db=Depends(get_db)):
    # 1. Check existing
    q = text("SELECT id FROM users WHERE email = :email")
    res = db.execute(q, {"email": payload.email}).first()
    if res:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    hashed = get_password_hash(payload.password)
    
    # 2. Generate UUID explicitly
    new_id = str(uuid.uuid4()) 

    # 3. Insert without RETURNING (SQLite Safe)
    insert = text(
        "INSERT INTO users (id, email, hashed_password, full_name, is_active) VALUES (:id, :email, :hp, :fn, true)"
    )
    db.execute(insert, {"id": new_id, "email": payload.email, "hp": hashed, "fn": payload.full_name})
    
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    # 4. Return Data
    return {
        "id": new_id,
        "email": payload.email,
        "full_name": payload.full_name,
        "is_active": True,
        "created_at": datetime.utcnow().isoformat()
    }


@app.post("/api/v1/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db=Depends(get_db)):
    q = text("SELECT id, email, hashed_password FROM users WHERE email = :email")
    row = db.execute(q, {"email": payload.email}).first()
    if not row:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    user_id, email, hashed = row[0], row[1], row[2]
    if not verify_password(payload.password, hashed):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(subject=str(user_id))
    return {"access_token": token, "token_type": "bearer"}
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


@app.get("/health")
def health():
    return {"status": "ok", "mode": "serverless"}


@app.post("/api/v1/chat")
async def chat_endpoint(payload: ChatRequest):
    # Note: Frontend handles 429 errors gracefully
    resp = await ChatbotService.get_response(payload.message)
    return {"response": resp}


# FIX: Register with UUID and No RETURNING Clause
@app.post("/api/v1/auth/register", status_code=201)
def register(payload: RegisterRequest, db=Depends(get_db)):
    # 1. Check existing
    q = text("SELECT id FROM users WHERE email = :email")
    res = db.execute(q, {"email": payload.email}).first()
    if res:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    hashed = get_password_hash(payload.password)
    
    # 2. Generate UUID explicitly
    new_id = str(uuid.uuid4()) 

    # 3. Insert without RETURNING (SQLite Safe)
    insert = text(
        "INSERT INTO users (id, email, hashed_password, full_name, is_active) VALUES (:id, :email, :hp, :fn, true)"
    )
    db.execute(insert, {"id": new_id, "email": payload.email, "hp": hashed, "fn": payload.full_name})
    
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    # 4. Return Data
    return {
        "id": new_id,
        "email": payload.email,
        "full_name": payload.full_name,
        "is_active": True,
        "created_at": datetime.utcnow().isoformat()
    }


@app.post("/api/v1/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db=Depends(get_db)):
    q = text("SELECT id, email, hashed_password FROM users WHERE email = :email")
    row = db.execute(q, {"email": payload.email}).first()
    if not row:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    user_id, email, hashed = row[0], row[1], row[2]
    if not verify_password(payload.password, hashed):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(subject=str(user_id))
    return {"access_token": token, "token_type": "bearer"}
