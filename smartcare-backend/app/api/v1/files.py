from fastapi import APIRouter, Depends, HTTPException, Header, Request
from pydantic import BaseModel
from ...database import get_db
from ...models.audit_log import AuditLog
from ...core.config import settings
from supabase import create_client, Client
import logging
import hmac
import hashlib

from .medical_records import get_current_user_id

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize Supabase Admin Client (Server-side) safely. If initialization fails,
# don't crash the entire application at import time — set supabase to None and
# surface a 503 at runtime for file endpoints.
supabase: Client | None = None
try:
    if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY:
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
        logger.info("Supabase client initialized")
    else:
        logger.warning("Supabase client not initialized: missing URL or service role key")
        supabase = None
except Exception as exc:
    logger.error("Failed initializing Supabase client: %s", exc)
    supabase = None


class SignUrlRequest(BaseModel):
    file_path: str
    bucket: str = "chat-files"


@router.post("/sign-url")
def generate_signed_url(payload: SignUrlRequest, user_id: str = Depends(get_current_user_id), db=Depends(get_db), request: Request = None):
    # If Supabase is not configured correctly, return 503 so other parts remain functional
    if supabase is None:
        raise HTTPException(status_code=503, detail="File storage service is unavailable")

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

        # 2. AUDIT LOGGING - pseudonymize IP addresses before storage (GDPR)
        ip = None
        if request:
            xff = request.headers.get("x-forwarded-for")
            if xff:
                ip = xff.split(",")[0].strip()
            elif getattr(request, "client", None):
                ip = request.client.host

        masked_ip = '0.0.0.0'
        try:
            if ip and settings.ENCRYPTION_KEY:
                masked_ip = hmac.new(settings.ENCRYPTION_KEY.encode(), ip.encode(), hashlib.sha256).hexdigest()
        except Exception:
            masked_ip = '0.0.0.0'

        audit_entry = AuditLog(
            user_id=user_id,
            target_id=payload.file_path,
            action="SHARE_FILE",
            resource_type="FILE_ATTACHMENT",
            ip_address=masked_ip
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
