"""
Protected Key Service

This endpoint returns the wrapped key metadata only after verifying the user's
JWT (RS256) from the HttpOnly cookie and ensuring the requester is the owner.
Access control is enforced in multiple layers:
 - JWT verification with RS256 public key
 - DB-level Row Level Security (recommended via migration)
 - Application-level check that the token subject matches the requested record

Defense-in-depth: even if the application layer is bypassed, RLS should prevent
unauthorized row access at the DB level.
"""
from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.vault import KeyMetadata
from app.models.user import User
from jose import jwt, JWTError
from app.core.config import settings

router = APIRouter()


def _user_from_cookie(request: Request, db: Session) -> User:
    token = request.cookies.get('access_token')
    if not token:
        raise HTTPException(status_code=401, detail='Not authenticated')
    try:
        payload = jwt.decode(token, settings.PUBLIC_KEY, algorithms=['RS256'])
        sub = payload.get('sub')
        if not sub:
            raise HTTPException(status_code=401, detail='Invalid token payload')
        user = db.query(User).filter(User.id == str(sub)).first()
        if not user:
            raise HTTPException(status_code=401, detail='User not found')
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail='Invalid token')


@router.get('/{key_id}')
def get_wrapped_key(key_id: str, request: Request, db: Session = Depends(get_db)):
    # Verify session and identity
    user = _user_from_cookie(request, db)

    # Fetch metadata
    km = db.query(KeyMetadata).filter(KeyMetadata.id == key_id).first()
    if not km:
        raise HTTPException(status_code=404, detail='Key not found')

    # Ensure owner match — additional protection in app layer.
    if str(km.user_id) != str(user.id):
        raise HTTPException(status_code=403, detail='Forbidden')

    # Return only wrapped components required by client to unwrap locally.
    return {
        'id': km.id,
        'wrapped_key': km.wrapped_key,
        'key_iv': km.key_iv,
        'key_salt': km.key_salt,
        'created_at': km.created_at.isoformat() if km.created_at else None,
    }
