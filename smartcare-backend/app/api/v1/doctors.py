from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.database import get_db
from app.models.doctor import Doctor
from app.models.user import User
from app.api.v1.auth import get_current_user

router = APIRouter()

# Pydantic Schemas
class DoctorResponse(BaseModel):
    id: int
    user_id: str
    name: str # from User
    email: str # from User
    avatar: Optional[str] = None # from User
    specialization: Optional[str] = None
    bio: Optional[str] = None
    consultation_fee: float = 0.0
    availability: Optional[dict] = None

    class Config:
        orm_mode = True

class UpdateDoctorProfile(BaseModel):
    specialization: Optional[str] = None
    bio: Optional[str] = None
    consultation_fee: Optional[float] = None
    availability: Optional[dict] = None # {"mon": ["09:00", "17:00"]}


@router.get("/", response_model=List[DoctorResponse])
def get_doctors(
    search: Optional[str] = None, 
    specialization: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Doctor).join(User)
    
    if search:
        query = query.filter(User.full_name.ilike(f"%{search}%"))
    if specialization:
        query = query.filter(Doctor.specialization.ilike(f"%{specialization}%"))
        
    doctors = query.all()
    
    # Map to response schema manually if needed, or rely on ORM mode if structure matches
    # Since we are flattening User fields into the response, we might need a helper or manual map
    results = []
    for d in doctors:
        results.append({
            "id": d.id,
            "user_id": d.user_id,
            "name": d.user.full_name if d.user.full_name else d.user.email.split('@')[0],
            "email": d.user.email,
            "avatar": d.user.avatar,
            "specialization": d.specialization,
            "bio": d.bio,
            "consultation_fee": d.consultation_fee,
            "availability": d.availability
        })
    return results

@router.put("/profile")
def update_profile(
    payload: UpdateDoctorProfile,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != 'doctor':
        raise HTTPException(status_code=403, detail="Only doctors can update this profile")
        
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    
    # Auto-create profile if missing for a doctor user
    if not doctor:
        doctor = Doctor(user_id=current_user.id)
        db.add(doctor)
    
    if payload.specialization is not None:
        doctor.specialization = payload.specialization
    if payload.bio is not None:
        doctor.bio = payload.bio
    if payload.consultation_fee is not None:
        doctor.consultation_fee = payload.consultation_fee
    if payload.availability is not None:
        doctor.availability = payload.availability
        
    db.commit()
    db.refresh(doctor)
    return {"status": "success", "profile": {
        "specialization": doctor.specialization,
        "bio": doctor.bio
    }}
