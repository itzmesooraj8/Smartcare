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
    return {'id': user.id, 'email': user.email}
