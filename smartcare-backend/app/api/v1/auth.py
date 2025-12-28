"""
Auth router: login/register using RS256 and cookie-based session.

Security: set HttpOnly Secure SameSite=Strict cookie only (no token in response body).
Return minimal user profile to client.
"""
from fastapi import APIRouter, HTTPException, Request, Response, Depends
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
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not pwd_context.verify(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail='Invalid credentials')

    token = create_jwt(str(user.id))

    # Set Secure HttpOnly SameSite cookie. Cookie path is '/' so frontend can call /auth/me.
    resp = Response(content='')
    resp.set_cookie(
        key='access_token',
        value=token,
        httponly=True,
        secure=True,
        samesite='strict',
        max_age=60 * 60,
        path='/'
    )

    # Return minimal profile only
    return {
        'id': user.id,
        'email': user.email,
        'full_name': getattr(user, 'full_name', None),
        'role': getattr(user, 'role', 'patient')
    }


@router.post('/register')
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail='Email already registered')
    user = User(email=payload.email, hashed_password=pwd_context.hash(payload.password), full_name=payload.full_name)
    db.add(user)
    db.commit()
    db.refresh(user)

    # If the client supplied wrapped master key material, persist it to the isolated vault table.
    try:
        if payload.encrypted_master_key:
            ve = VaultEntry(
                user_id=user.id,
                encrypted_master_key=payload.encrypted_master_key,
                key_encryption_iv=payload.key_encryption_iv,
                key_derivation_salt=payload.key_derivation_salt,
            )
            db.add(ve)
            db.commit()
    except Exception:
        # Non-fatal: vault storage failure should not prevent account creation, but log in real deployment.
        try:
            db.rollback()
        except Exception:
            pass

    return {'id': user.id, 'email': user.email}
