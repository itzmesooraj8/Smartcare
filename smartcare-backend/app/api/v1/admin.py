from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from app.core.config import settings
from app.database import get_db
from app.models.user import User
from app.models.appointment import Appointment

router = APIRouter()


def get_token_payload(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        raise HTTPException(status_code=401, detail="Invalid Authorization header")
    token = parts[1]
    try:
        payload = jwt.decode(token, settings.PUBLIC_KEY, algorithms=["RS256"])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


def require_admin(payload: dict = Depends(get_token_payload)) -> dict:
    role = payload.get('role')
    if role != 'admin':
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return payload


@router.get("/stats")
def get_stats(db: Session = Depends(get_db), _payload: dict = Depends(require_admin)):
    total_users = db.query(User).count()
    doctors = db.query(User).filter(getattr(User, 'role', None) == 'doctor').count()
    patients = db.query(User).filter(getattr(User, 'role', None) == 'patient').count()
    appointments = db.query(Appointment).count()
    return {
        "total_users": total_users,
        "doctors": doctors,
        "patients": patients,
        "appointments": appointments,
    }


@router.get("/users")
def list_users(db: Session = Depends(get_db), _payload: dict = Depends(require_admin)):
    rows = db.query(User).all()
    result = []
    for u in rows:
        result.append({
            "id": u.id,
            "full_name": getattr(u, 'full_name', None) or u.email,
            "email": u.email,
            "role": getattr(u, 'role', None) or 'patient',
            "created_at": u.created_at.isoformat() if getattr(u, 'created_at', None) else None,
        })
    return result


@router.delete("/users/{user_id}")
def delete_user(user_id: str, db: Session = Depends(get_db), _payload: dict = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    try:
        db.delete(user)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    return {"status": "deleted", "id": user_id}
