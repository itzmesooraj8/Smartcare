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

        # Standard Supabase Python client returns a dict like {"data": {"signedURL": "..."}, "error": None}
        signed_url = None
        if isinstance(res, dict):
            data = res.get("data") or {}
            # prefer the canonical key used by Supabase SDK: 'signedURL'
            signed_url = data.get("signedURL") or data.get("signed_url") or data.get("signedUrl")
        else:
            data = getattr(res, "data", None)
            if isinstance(data, dict):
                signed_url = data.get("signedURL") or data.get("signed_url") or data.get("signedUrl")

        # 2. AUDIT LOGGING
        ip = None
        if request:
            xff = request.headers.get("x-forwarded-for")
            if xff:
                ip = xff.split(",")[0].strip()
            elif getattr(request, "client", None):
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

        # Return the standard Supabase-shaped response so callers can rely on stable keys
        return {"data": {"signedURL": signed_url}, "error": None}

    except Exception as e:
        try:
            db.rollback()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=str(e))
