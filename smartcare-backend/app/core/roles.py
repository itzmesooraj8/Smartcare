from fastapi import Depends, HTTPException, status
from app.models.user import UserRole, User
from app.core.deps import get_current_user

def require_role(required_roles: list[UserRole]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden for role: {current_user.role}"
            )
        return current_user
    return role_checker

