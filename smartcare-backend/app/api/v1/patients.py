from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.database import get_db
from app.models.patient import Patient
from app.models.user import User
from app.api.v1.auth import get_current_user

router = APIRouter()

class PatientResponse(BaseModel):
    id: int
    user_id: str
    name: str
    email: str
    avatar: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None

@router.get("/", response_model=List[PatientResponse])
def get_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only Admin or Doctors should see the full patient list
    if current_user.role not in ['admin', 'doctor']:
        raise HTTPException(status_code=403, detail="Access denied")

    # Find all users with role 'patient' OR entries in 'patients' table
    # A cleaner way is to look at the User table joined with Patient
    
    # 1. Get all users who are 'patient' role
    # 2. Left join with Patient profile to get extra details
    
    query = db.query(User, Patient).outerjoin(Patient, User.id == Patient.user_id).filter(User.role == 'patient')
    
    rows = query.all()
    results = []
    for u, p in rows:
        results.append({
            "id": p.id if p else 0, # 0 if profile not yet created
            "user_id": u.id,
            "name": u.full_name or u.email.split('@')[0],
            "email": u.email,
            "avatar": u.avatar,
            "date_of_birth": p.date_of_birth.isoformat() if p and p.date_of_birth else None,
            "gender": p.gender if p else None,
            "blood_group": p.blood_group if p else None
        })
        
    return results
