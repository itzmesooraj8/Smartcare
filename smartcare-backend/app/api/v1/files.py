from fastapi import APIRouter, Depends, HTTPException, Header, Request
from pydantic import BaseModel
from ...database import get_db
from ...models.audit_log import AuditLog
from ...core.config import settings
from supabase import create_client, Client

from .medical_records import get_current_user_id

router = APIRouter()

# Initialize Supabase Admin Client (Server-side)
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


class SignUrlRequest(BaseModel):
    file_path: str
    bucket: str = "chat-files"


@router.post("/sign-url")
def generate_signed_url(payload: SignUrlRequest, user_id: str = Depends(get_current_user_id), db=Depends(get_db), request: Request = None):
    try:
        # 1. Generate Signed URL (valid for 60 mins)
        res = supabase.storage.from_(payload.bucket).create_signed_url(payload.file_path, 3600)

        # Try several possible response shapes
        signed_url = None
        if isinstance(res, dict):
            signed_url = res.get('signedURL') or res.get('signed_url') or res.get('signedUrl') or (res.get('data') and res.get('data').get('signed_url'))
        elif hasattr(res, 'get'):
            try:
                signed_url = res.get('signedURL')
            except Exception:
                signed_url = None

        if not signed_url:
            # As a fallback, try reading raw dict
            try:
                signed_url = str(res)
            except Exception:
                signed_url = None

        # 2. AUDIT LOGGING
        ip = None
        if request and getattr(request, 'client', None):
            ip = request.client.host

        audit_entry = AuditLog(
            user_id=user_id,
            target_id=payload.file_path,
            action="SHARE_FILE",
            resource_type="FILE_ATTACHMENT",
            ip_address=ip or '0.0.0.0'
        )
        db.add(audit_entry)
        db.commit()

        return {"signedUrl": signed_url}

    except Exception as e:
        try:
            db.rollback()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=str(e))
