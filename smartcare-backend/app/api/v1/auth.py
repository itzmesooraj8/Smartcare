from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from app.database import get_db
from app.models.user import User
from app.models.vault_entry import VaultEntry
from app.core.security import create_jwt, settings
import hashlib
from datetime import datetime

# --- 1. SETUP SECURITY ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
router = APIRouter()

# --- 2. DEFINE SCHEMAS ---
# Renamed back to UserRegister/UserLogin to fix your "NameError"
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "patient"
    encrypted_master_key: str | None = None
    key_encryption_iv: str | None = None
    key_derivation_salt: str | None = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# --- 3. THE SAFE HASH HELPER ---
def get_safe_hash(password: str) -> str:
    """Compresses password to 64 chars to prevent Bcrypt crashes."""
    return hashlib.sha256(password.encode()).hexdigest()

# --- 4. ENDPOINTS ---

@router.post("/register")
def register(payload: UserRegister, db: Session = Depends(get_db)):
    # 1. Check if user exists
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # 2. Hash Password Safely
    safe_pw_input = get_safe_hash(payload.password)
    hashed_pw = pwd_context.hash(safe_pw_input)

    # 3. Create User
    new_user = User(
        email=payload.email,
        hashed_password=hashed_pw,
        full_name=payload.full_name,
        role=payload.role,
        created_at=datetime.utcnow()
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 4. Save Vault Entry (Keys)
    if payload.encrypted_master_key:
        vault_entry = VaultEntry(
            user_id=new_user.id,
            encrypted_master_key=payload.encrypted_master_key,
            key_encryption_iv=payload.key_encryption_iv,
            key_derivation_salt=payload.key_derivation_salt
        )
        db.add(vault_entry)
        db.commit()
    
    return {"message": "User created successfully", "user": {"id": new_user.id, "email": new_user.email}}

@router.post("/login")
def login(payload: UserLogin, response: Response, db: Session = Depends(get_db)):
    # 1. Find User
    user = db.query(User).filter(User.email == payload.email).first()
    
    # 2. Verify Password (Safely)
    safe_pw_input = get_safe_hash(payload.password)
    if not user or not pwd_context.verify(safe_pw_input, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # 3. Create Token
    access_token = create_jwt(str(user.id))

    # 4. Set Secure Cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="none",
        secure=True,
        max_age=3600
    )
    
    return {
        "message": "Login successful", 
        "user": {
            "id": user.id, 
            "email": user.email, 
            "full_name": user.full_name, 
            "role": user.role
        },
        "access_token": access_token
    }

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    return {"message": "Logged out"}

    safe_pw_input = get_safe_hash(payload.password)
    hashed_pw = pwd_context.hash(safe_pw_input)

    # Create User
    new_user = User(
        email=payload.email,
        hashed_password=hashed_pw, # ✅ We use the pre-calculated hash
        full_name=payload.full_name,
        created_at=datetime.utcnow()
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "User created successfully", "user": {"email": new_user.email, "id": new_user.id}}

@router.post("/login")
def login(payload: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    
    # 👇 CRITICAL: We must also shrink the input password here to match!
    safe_pw_input = get_safe_hash(payload.password)
    
    if not user or not pwd_context.verify(safe_pw_input, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Set Session Cookie
    response.set_cookie(
        key="smartcare_token", 
        value=f"user_{user.id}", 
        httponly=True, 
        samesite="none", 
        secure=True
    )
    
    return {"message": "Login successful", "user": {"email": user.email, "full_name": user.full_name, "role": user.role}}

@router.get("/me")
def read_users_me(response: Response, db: Session = Depends(get_db)):
    raise HTTPException(status_code=401, detail="Not authenticated")

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("smartcare_token")
    return {"message": "Logged out"}
"""Auth router: login/register using RS256 and cookie-based session.

Passwords are pre-hashed with SHA-256 on the server before being handed
to bcrypt to avoid bcrypt's 72-byte truncation issue when clients send
very large (e.g. encrypted) password strings.
"""
from fastapi import APIRouter, HTTPException, Request, Depends
import logging
from pydantic import BaseModel, EmailStr
from app.database import get_db
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.vault_entry import VaultEntry
from app.core.security import create_jwt
from app.core.config import settings
from passlib.context import CryptContext
import hashlib

pwd_context = CryptContext(schemes=["bcrypt"], bcrypt__rounds=12, deprecated="auto")

router = APIRouter()


def get_safe_hash(password: str) -> str:
    """Return a SHA-256 hex digest of the provided password string.

    This digest (a fixed-length ASCII hex string) is what we pass to
    bcrypt to avoid issues with overly long inputs.
    """
    if password is None:
        return ""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None
    encrypted_master_key: str | None = None
    key_encryption_iv: str | None = None
    key_derivation_salt: str | None = None


@router.post('/login')
def login(request: Request, payload: LoginIn, db: Session = Depends(get_db)):
    logger = logging.getLogger('smartcare.auth')
    try:
        user = db.query(User).filter(User.email == payload.email).first()
        safe = get_safe_hash(payload.password)
        if not user or not pwd_context.verify(safe, user.hashed_password):
            raise HTTPException(status_code=401, detail='Invalid credentials')

        token = create_jwt(str(user.id))

        user_profile = {
            'id': user.id,
            'email': user.email,
            'full_name': getattr(user, 'full_name', None),
            'role': getattr(user, 'role', 'patient')
        }

        from fastapi.responses import JSONResponse
        response = JSONResponse(content={'user': user_profile})
        response.set_cookie(
            key='access_token',
            value=token,
            httponly=True,
            secure=True,
            samesite='none',
            max_age=60 * 60,
            path='/'
        )
        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.exception('Unhandled exception in login')
        env = getattr(settings, 'ENVIRONMENT', '') or ''
        if env.lower() != 'production':
            raise HTTPException(status_code=500, detail=f'Internal server error: {str(e)}')
        raise HTTPException(status_code=500, detail='Internal server error')


@router.post('/register')
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail='Email already registered')

    try:
        domain = payload.email.split('@')[-1].lower()
    except Exception:
        domain = ''
    if domain in ('localhost', 'example.com') or domain.startswith('demo') or 'demo' in domain:
        raise HTTPException(status_code=400, detail='Registration using demo/local domains is not allowed')

    safe = get_safe_hash(payload.password)
    user = User(email=payload.email, hashed_password=pwd_context.hash(safe), full_name=payload.full_name)
    db.add(user)
    db.commit()
    db.refresh(user)

    ve = VaultEntry(
        user_id=user.id,
        encrypted_master_key=payload.encrypted_master_key or None,
        key_encryption_iv=payload.key_encryption_iv or None,
        key_derivation_salt=payload.key_derivation_salt or None,
    )
    try:
        db.add(ve)
        db.commit()
    except Exception:
        try:
            db.rollback()
        except Exception:
            pass

    return {'id': user.id, 'email': user.email}
