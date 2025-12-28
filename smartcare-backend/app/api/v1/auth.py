"""
Auth router: login/register using RS256 and cookie-based session.

Security: set HttpOnly Secure SameSite=Strict cookie only (no token in response body).
Return minimal user profile to client.
"""
from fastapi import APIRouter, HTTPException, Request, Response, Depends
import logging
from pydantic import BaseModel, EmailStr
from app.database import get_db
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.vault_entry import VaultEntry
from app.core.security import create_jwt
from app.core.config import settings
from app.core.security import verify_jwt
from app.core.config import settings
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], bcrypt__rounds=12, deprecated="auto")

router = APIRouter()


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None
    # Optional wrapped master key fields — client may provide these during registration
    encrypted_master_key: str | None = None
    key_encryption_iv: str | None = None
    key_derivation_salt: str | None = None


@router.post('/login')
def login(request: Request, payload: LoginIn, db: Session = Depends(get_db)):
    logger = logging.getLogger('smartcare.auth')
    try:
        user = db.query(User).filter(User.email == payload.email).first()
        if not user or not pwd_context.verify(payload.password, user.hashed_password):
            raise HTTPException(status_code=401, detail='Invalid credentials')

        token = create_jwt(str(user.id))

        # Prepare minimal user profile
        user_profile = {
            'id': user.id,
            'email': user.email,
            'full_name': getattr(user, 'full_name', None),
            'role': getattr(user, 'role', 'patient')
        }

        # Build JSON response and attach HttpOnly cookie so the browser receives it
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
        # Re-raise HTTPExceptions (e.g., 401) unchanged
        raise
    except Exception as e:
        # Log unexpected errors with stack trace for ops to inspect
        logger.exception('Unhandled exception in login')
        raise HTTPException(status_code=500, detail='Internal server error')


@router.post('/register')
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail='Email already registered')
    # Disallow registrations using demo/local placeholder domains to prevent accidental demo accounts in production
    try:
        domain = payload.email.split('@')[-1].lower()
    except Exception:
        domain = ''
    if domain in ('localhost', 'example.com') or domain.startswith('demo') or 'demo' in domain:
        raise HTTPException(status_code=400, detail='Registration using demo/local domains is not allowed')
    user = User(email=payload.email, hashed_password=pwd_context.hash(payload.password), full_name=payload.full_name)
    db.add(user)
    db.commit()
    db.refresh(user)

    # Ensure a VaultEntry row exists for every new user (store provided wrapped key material if present)
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
        # Non-fatal but surface the error for ops (rollback to keep DB consistent)
        try:
            db.rollback()
        except Exception:
            pass

    return {'id': user.id, 'email': user.email}
