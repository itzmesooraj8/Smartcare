"""
Core Security Module: RS256 JWT lifecycle, Argon2id password hashing, and centralized FastAPI authorization dependencies.

Centralized authorization flow:
Request
   ↓
Authorization Header (Bearer) or HttpOnly Cookie (access_token)
   ↓
verify_access_token (RS256 with PUBLIC_KEY, clock verification via UTC)
   ↓
get_token_payload (validates sub, exp, scopes)
   ↓
get_authenticated_user (resolves User from db by sub; permits pre_auth for MFA flows)
   ↓
require_full_access (enforces 'full_access' in scopes; rejects 'pre_auth' with 403 Forbidden)
   ↓
get_current_user (User with full_access enforced)
   ↓
get_current_user_id (str user_id with full_access enforced)
   ↓
require_role (role-based access control)
"""
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List
import logging

from fastapi import Depends, HTTPException, Request, status, Cookie
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database import get_db
from app.models.user import User

logger = logging.getLogger("smartcare.security")

# Token lifetime and cryptographic schemes
ACCESS_TOKEN_EXPIRE_MINUTES = getattr(settings, "ACCESS_TOKEN_EXPIRE_MINUTES", 15)
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# OAuth2 bearer token scheme (auto_error=False to allow seamless cookie fallback)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


# --- Cryptographic Password Operations ---

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain-text password against an Argon2id hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generates an Argon2id password hash."""
    return pwd_context.hash(password)


# --- JWT Lifecycle (RS256 Asymmetric Cryptography) ---

def create_access_token(
    subject: str,
    role: Optional[str] = None,
    scopes: Optional[List[str]] = None,
    expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES,
    extra: Optional[Dict[str, Any]] = None,
) -> str:
    """Create an RS256 signed JWT using server PRIVATE_KEY with UTC timestamps."""
    now = datetime.now(timezone.utc)
    token_scopes = scopes if scopes is not None else ["full_access"]
    payload: Dict[str, Any] = {
        "sub": str(subject),
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=expires_minutes)).timestamp()),
        "scopes": token_scopes,
    }
    if role:
        payload["role"] = role
    if extra:
        payload.update(extra)

    return jwt.encode(payload, settings.PRIVATE_KEY, algorithm="RS256")


def create_jwt(subject: str, extra: Optional[Dict[str, Any]] = None, expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES) -> str:
    """Compatibility alias for create_access_token."""
    role = extra.get("role") if extra else None
    scopes = extra.get("scopes") if extra else None
    return create_access_token(subject=subject, role=role, scopes=scopes, expires_minutes=expires_minutes, extra=extra)


def verify_access_token(token: str) -> Dict[str, Any]:
    """Verify RS256 token using PUBLIC_KEY. Raises JWTError on failure."""
    try:
        payload = jwt.decode(token, settings.PUBLIC_KEY, algorithms=["RS256"])
        return payload
    except JWTError:
        logger.debug("JWT verification failed (invalid signature, format, or expired)")
        raise


def verify_jwt(token: str) -> Dict[str, Any]:
    """Compatibility alias for verify_access_token."""
    return verify_access_token(token)


# --- Centralized Authorization Dependencies ---

def extract_token_from_request(
    header_token: Optional[str] = Depends(oauth2_scheme),
    cookie_token: Optional[str] = Cookie(None, alias="access_token"),
) -> str:
    """
    Extracts the JWT from the Authorization header (Bearer) or the HttpOnly access_token cookie.
    Raises 401 UNAUTHORIZED if neither is present.
    """
    token = header_token or cookie_token
    if not token:
        logger.debug("Authentication failed: missing Authorization header or access_token cookie")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return token


def get_token_payload(token: str = Depends(extract_token_from_request)) -> Dict[str, Any]:
    """
    Validates the RS256 token and returns the decoded payload.
    Raises 401 UNAUTHORIZED if invalid or expired.
    """
    try:
        payload = verify_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload: missing sub claim",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return payload
    except (JWTError, HTTPException) as exc:
        if isinstance(exc, HTTPException):
            raise exc
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_authenticated_user(
    payload: Dict[str, Any] = Depends(get_token_payload),
    db: Session = Depends(get_db),
) -> User:
    """
    Resolves the database User corresponding to the token subject.
    DOES NOT enforce 'full_access' scope; permitted for MFA step-up and pre-auth verification.
    """
    user_id = payload["sub"]
    user = db.query(User).filter(User.id == str(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )
    return user


def require_full_access(payload: Dict[str, Any] = Depends(get_token_payload)) -> Dict[str, Any]:
    """
    CRITICAL SECURITY BOUNDARY:
    Enforces that the token possesses the 'full_access' scope.
    Tokens carrying only 'pre_auth' (pending MFA TOTP verification) are strictly rejected
    with 403 Forbidden.
    """
    scopes = payload.get("scopes", [])
    if "full_access" not in scopes:
        logger.warning("Access denied: Token requires full_access scope; provided scopes=%s", scopes)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Full access scope required: complete multi-factor authentication (MFA)",
        )
    return payload


def get_current_user(
    user: User = Depends(get_authenticated_user),
    _scope: Dict[str, Any] = Depends(require_full_access),
) -> User:
    """
    Primary user dependency for all protected clinical, patient, and operational endpoints.
    Requires BOTH a valid active user and the 'full_access' scope.
    """
    return user


def get_current_user_id(
    current_user: User = Depends(get_current_user),
) -> str:
    """
    Primary user ID dependency. Returns the user's ID as a string.
    Inherits get_current_user guarantees (active user + full_access scope).
    """
    return str(current_user.id)


def require_role(allowed_roles: List[str]):
    """
    Role-based authorization dependency factory.
    Enforces that current_user.role is in allowed_roles.
    """
    def _role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation requires one of roles: {allowed_roles}",
            )
        return current_user
    return _role_checker
