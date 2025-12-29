from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import jwt, JWTError

from app.core.config import settings
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.database import get_db
from app.models.user import User
from app.models.audit_log import AuditLog
import logging

logger = logging.getLogger("smartcare.audit")

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], bcrypt__rounds=12)
# Use settings-defined TTL (config enforces a conservative maximum)
ACCESS_TOKEN_EXPIRE_MINUTES = getattr(settings, "ACCESS_TOKEN_EXPIRE_MINUTES", 15)

# Local limiter for auth endpoints (conservative limits to reduce brute-force risk)
limiter = Limiter(key_func=get_remote_address)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


def create_access_token(subject: str, role: str | None = None, scopes: list[str] | None = None) -> str:
    from datetime import datetime, timedelta
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": subject, "exp": expire, "scopes": scopes or []}
    if role:
        to_encode["role"] = role
    return jwt.encode(to_encode, settings.PRIVATE_KEY, algorithm="RS256")


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None
    role: str | None = "patient"
    encrypted_master_key: str | None = None
    key_encryption_iv: str | None = None
    key_derivation_salt: str | None = None


@router.post("/register")
def register(payload: RegisterRequest, db=Depends(get_db)):
    # Server-side password hashing
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    hashed = pwd_context.hash(payload.password)
    is_doctor = (payload.role == 'doctor')
    user = User(email=payload.email, hashed_password=hashed, full_name=payload.full_name or None, role=payload.role or 'patient', is_active=(not is_doctor))
    db.add(user)
    db.commit()
    db.refresh(user)

    # Store wrapped master key in vault if provided
    if payload.encrypted_master_key:
        try:
            from app.models.vault_entry import VaultEntry
            ve = VaultEntry(user_id=str(user.id), encrypted_master_key=payload.encrypted_master_key, key_encryption_iv=payload.key_encryption_iv, key_derivation_salt=payload.key_derivation_salt)
            db.add(ve)
            db.commit()
        except Exception:
            db.rollback()

    # Generate a one-time recovery key for the user to save locally (presented to user)
    import secrets
    recovery_key = secrets.token_hex(32)

    return {"status": "created", "user": {"id": user.id, "email": user.email, "role": user.role}, "recovery_key": recovery_key}


@router.post("/login")
@limiter.limit("5/minute")
def login(request: Request, payload: LoginRequest, db=Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    role = getattr(user, "role", "patient")
    # If user has MFA configured, issue a limited "pre_auth" token and require
    # the client to complete MFA to receive the full-access token.
    if getattr(user, "mfa_totp_secret", None):
        token = create_access_token(subject=str(user.id), role=role, scopes=["pre_auth"])
        mfa_required = True
    else:
        token = create_access_token(subject=str(user.id), role=role, scopes=["full_access"])
        mfa_required = False
    # Record immutable audit log for successful login (do not block login on failure)
    try:
        ip = None
        if getattr(request, "client", None):
            ip = getattr(request.client, "host", None)
        audit = AuditLog(user_id=str(user.id), action="LOGIN", resource_type="auth", ip_address=ip)
        db.add(audit)
        db.commit()
    except Exception as e:
        # Do not silently ignore audit failures — record for operators. In higher-security
        # deployments you may want to fail the action instead of failing open.
        logger.error("AUDIT LOG FAILURE: %s", str(e))
    # Indicate whether MFA is required so the frontend can prompt for the code
    response = JSONResponse(content={"user": {"id": user.id, "email": user.email, "role": role}, "mfa_required": mfa_required})
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    return response


def get_current_user_id(request: Request) -> str:
    """Decodes the JWT from the access_token cookie."""
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, settings.PUBLIC_KEY, algorithms=["RS256"])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")