from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.core.roles import require_role

router = APIRouter()

# Patients can access their own profile
@router.get("/me")
def get_my_profile(current_user: User = Depends(require_role([UserRole.patient, UserRole.doctor, UserRole.admin]))):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role
    }

#  Only doctors can access doctor dashboard
@router.get("/doctor-dashboard")
def doctor_dashboard(current_user: User = Depends(require_role([UserRole.doctor]))):
    return {"msg": f"Welcome Doctor {current_user.name}"}

#  Only admins can access admin dashboard
@router.get("/admin-dashboard")
def admin_dashboard(current_user: User = Depends(require_role([UserRole.admin]))):
    return {"msg": f"Welcome Admin {current_user.name}"}
