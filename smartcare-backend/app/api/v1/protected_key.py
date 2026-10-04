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

from app.core.security import get_current_user

router = APIRouter()


@router.get('/{key_id}')
def get_wrapped_key(key_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user = current_user

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
