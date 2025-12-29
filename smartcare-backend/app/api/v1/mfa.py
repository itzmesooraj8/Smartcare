from fastapi import APIRouter, Depends, HTTPException, Request, Header
from pydantic import BaseModel
import pyotp
from app.database import get_db
from sqlalchemy.orm import Session
from app.models.user import User
from app.api.v1.medical_records import get_current_user
from jose import jwt, JWTError
from app.core.config import settings
from slowapi import Limiter
from slowapi.util import get_remote_address

# Conservative rate limits for MFA endpoints
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
    # Generate a TOTP secret for the user. In production this should be encrypted at rest.
    secret = pyotp.random_base32()
    provisioning_uri = pyotp.totp.TOTP(secret).provisioning_uri(name=current_user.email, issuer_name="SmartCare")
    # Store secret server-side (should be encrypted in production storage)
    current_user.mfa_totp_secret = secret
    db.add(current_user)
    db.commit()
    return {"provisioning_uri": provisioning_uri, "secret": secret}

@router.post("/verify")
@limiter.limit("5/minute")
def verify_mfa(request: Request, req: VerifyRequest, db: Session = Depends(get_db)):
    # Ensure the request carries a "pre_auth" token (either via cookie or Authorization header)
    # If the token is not pre_auth, deny.
    token = None
    # Prefer cookie
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization")
        if auth and auth.lower().startswith("bearer "):
            token = auth.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, settings.PUBLIC_KEY, algorithms=["RS256"]) if token else {}
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    if "pre_auth" not in payload.get("scopes", []):
        raise HTTPException(status_code=403, detail="Pre-auth token required")

    # Resolve user from token subject (do not rely on get_current_user which requires full_access)
    sub = payload.get('sub')
    if not sub:
        raise HTTPException(status_code=401, detail='Invalid token payload')
    user = db.query(User).filter(User.id == str(sub)).first()
    if not user:
        raise HTTPException(status_code=401, detail='User not found')

    if not getattr(user, 'mfa_totp_secret', None):
        raise HTTPException(status_code=400, detail="MFA not configured for this user")
    totp = pyotp.TOTP(user.mfa_totp_secret)
    if not totp.verify(req.token, valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid MFA token")
    # Issue full access token on successful MFA
    full_token = create_full_access_token = None
    try:
        from app.api.v1.auth import create_access_token
        full_token = create_access_token(subject=str(user.id), role=getattr(user, 'role', None), scopes=["full_access"])
    except Exception:
        full_token = None

    response = {"verified": True}
    if full_token:
        response["full_access_token"] = full_token
    return response
