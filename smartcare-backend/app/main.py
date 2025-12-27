from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import jwt

# SlowAPI Imports (Corrected)
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

from app.database import engine, get_db, Base
from app.models.user import User

# 1. Setup Security & Rate Limiting
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Initialize Limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="SmartCare Backend")

# 2. Add Rate Limit Middleware
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

# 3. Custom Rate Limit Exception Handler (Fixes the ImportError)
def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please try again later."},
    )

app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# 4. CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Security Headers Middleware (Helmet-style) ---
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

# 5. Include Routers
app.include_router(signaling_module.router)
app.include_router(dashboard_module.router, prefix="/api/v1/patient")
app.include_router(appointments_module.router, prefix="/api/v1/appointments")
app.include_router(medical_records_module.router, prefix="/api/v1/medical-records")
app.include_router(tele_module.router, prefix="/api/v1/tele")
app.include_router(admin_module.router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(files_module.router, prefix="/api/v1/files", tags=["Files"])

# --- Models ---
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

# --- Endpoints ---

@app.on_event("startup")
async def ensure_tables_and_listeners():
    print("🏗️ Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created successfully.")
    try:
        if getattr(settings, "REDIS_URL", None):
            import asyncio as _asyncio
            _asyncio.create_task(signaling_module.manager.start_redis_listener())
            print("🔁 Redis signaling listener started")
    except Exception as e:
        print("⚠️ Failed to start Redis listener:", e)

@app.get("/health")
def health():
    return {"status": "ok", "mode": "production"}

@app.get("/api/v1/doctors")
def list_doctors(db=Depends(get_db)):
    doctors = db.query(User).filter(User.role == 'doctor').all()
    result = []
    for d in doctors:
        result.append({
            "id": d.id,
            "full_name": getattr(d, 'full_name', getattr(d, 'email', None)),
            "specialization": getattr(d, 'specialization', 'General'),
        })
    return result

@app.post("/api/v1/chat")
async def chat_endpoint(payload: ChatRequest):
    resp = await ChatbotService.get_response(payload.message)
    return {"response": resp}

# --- AUTH ENDPOINTS (FIXED) ---

def create_access_token(subject: str, role: Optional[str] = None, email: Optional[str] = None) -> str:
    to_encode = {"sub": subject}
    if role:
        to_encode.update({"role": role})
    if email:
        to_encode.update({"email": email})
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

@app.post("/api/v1/auth/register", status_code=201)
@limiter.limit("5/minute")
def register(request: Request, payload: RegisterRequest, db=Depends(get_db)):
    # The 'request' argument above is REQUIRED for slowapi to work
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    hashed = get_password_hash(payload.password)
    new_user = User(email=payload.email, hashed_password=hashed, full_name=payload.full_name, role="patient")
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
@limiter.limit("5/minute")
def login(request: Request, payload: LoginRequest, db=Depends(get_db)):
    # The 'request' argument above is REQUIRED for slowapi to work
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    user_role = getattr(user, 'role', 'patient')

    token = create_access_token(subject=str(user.id), role=user_role, email=user.email)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": getattr(user, 'full_name', None),
            "role": user_role,
        },
    }