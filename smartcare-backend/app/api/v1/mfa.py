from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import pyotp
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.core.security import (
    get_current_user,
    get_authenticated_user,
    get_token_payload,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

router = APIRouter()


class SetupResponse(BaseModel):
    provisioning_uri: str
    secret: str


class VerifyRequest(BaseModel):
    token: str


@router.post("/setup", response_model=SetupResponse)
@limiter.limit("1/minute")
def setup_mfa(request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Generates a new TOTP secret for the authenticated user (requires full_access)."""
    secret = pyotp.random_base32()
    provisioning_uri = pyotp.totp.TOTP(secret).provisioning_uri(name=current_user.email, issuer_name="SmartCare")
    current_user.mfa_totp_secret = secret
    db.add(current_user)
    db.commit()
    return {"provisioning_uri": provisioning_uri, "secret": secret}


@router.post("/verify")
@limiter.limit("5/minute")
def verify_mfa(
    request: Request,
    req: VerifyRequest,
    payload: dict = Depends(get_token_payload),
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
):
    """
    Verifies a TOTP token during MFA challenge.
    Accepts pre_auth or full_access token; validates the code,
    and returns a newly issued full_access token and sets the HttpOnly session cookie.
    """
    scopes = payload.get("scopes", [])
    if "pre_auth" not in scopes and "full_access" not in scopes:
        raise HTTPException(status_code=403, detail="Valid authentication token required")

    if not getattr(user, "mfa_totp_secret", None):
        raise HTTPException(status_code=400, detail="MFA not configured for this user")

    totp = pyotp.TOTP(user.mfa_totp_secret)
    if not totp.verify(req.token, valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid MFA token")

    # Issue verified full access token
    full_token = create_access_token(
        subject=str(user.id),
        role=getattr(user, "role", "patient"),
        scopes=["full_access"]
    )

    response = JSONResponse(content={
        "verified": True,
        "access_token": full_token,
        "user": {
            "id": str(user.id),
            "email": user.email,
            "role": user.role,
        }
    })
    response.set_cookie(
        key="access_token",
        value=full_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    return response
