from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import jwt
from sqlalchemy import text

from .core.config import settings
from .database import engine, get_db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ACCESS_TOKEN_EXPIRE_MINUTES = 60

app = FastAPI(title="SmartCare Backend (Auth Only)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


@app.on_event("startup")
def ensure_tables():
    sql = """
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        hashed_password TEXT NOT NULL,
        full_name TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT now()
    );
    """
    with engine.connect() as conn:
        conn.execute(text(sql))
        try:
            conn.commit()
        except Exception:
            # some engines / drivers don't require/ support explicit commit
            pass


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
    return {"status": "ok"}


@app.post("/api/v1/auth/register", status_code=201)
def register(payload: RegisterRequest, db=Depends(get_db)):
    # check existing
    q = text("SELECT id FROM users WHERE email = :email")
    res = db.execute(q, {"email": payload.email}).first()
    if res:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    hashed = get_password_hash(payload.password)
    insert = text(
        "INSERT INTO users (email, hashed_password, full_name, is_active) VALUES (:email, :hp, :fn, true) RETURNING id, email, full_name, is_active, created_at"
    )
    result = db.execute(insert, {"email": payload.email, "hp": hashed, "fn": payload.full_name})
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    row = result.first()
    return {"id": row[0], "email": row[1], "full_name": row[2], "is_active": row[3], "created_at": str(row[4])}


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
