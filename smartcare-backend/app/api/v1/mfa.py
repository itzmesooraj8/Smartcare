from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import pyotp
from app.database import get_db
from sqlalchemy.orm import Session
from app.models.user import User
from app.api.v1.medical_records import get_current_user

router = APIRouter()

class SetupResponse(BaseModel):
    provisioning_uri: str
    secret: str

class VerifyRequest(BaseModel):
    token: str

@router.post("/setup", response_model=SetupResponse)
def setup_mfa(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Generate a TOTP secret for the user. In production this should be encrypted at rest.
    secret = pyotp.random_base32()
    provisioning_uri = pyotp.totp.TOTP(secret).provisioning_uri(name=current_user.email, issuer_name="SmartCare")
    # Store secret server-side (should be encrypted in production storage)
    current_user.mfa_totp_secret = secret
    db.add(current_user)
    db.commit()
    return {"provisioning_uri": provisioning_uri, "secret": secret}

@router.post("/verify")
def verify_mfa(req: VerifyRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.mfa_totp_secret:
        raise HTTPException(status_code=400, detail="MFA not configured for this user")
    totp = pyotp.TOTP(current_user.mfa_totp_secret)
    if not totp.verify(req.token, valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid MFA token")
    return {"verified": True}
