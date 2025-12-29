from fastapi import HTTPException, Request, Depends
from jose import jwt, JWTError
from app.core.config import settings

def get_current_user_id(request: Request) -> str:
    """
    Decodes the JWT from the access_token cookie.
    Separated here to prevent circular imports with main.py.
    """
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

# If you have router = APIRouter() and login logic here, 
# MAKE SURE they do not import anything from main.py.