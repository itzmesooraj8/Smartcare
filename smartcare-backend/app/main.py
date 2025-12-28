import sys
import logging
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import jwt
import hashlib
import hmac
from fastapi import Response
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import settings
from app.services.chatbot import ChatbotService
from app import signaling as signaling_module
from app.api.v1 import dashboard as dashboard_module
from app.api.v1 import appointments as appointments_module
from app.api.v1 import medical_records as medical_records_module
from app.api.v1 import tele as tele_module
from app.api.v1 import admin as admin_module
from app.api.v1 import files as files_module
from app.api.v1 import video as video_module  # <--- ADD THIS
from app.api.v1 import mfa as mfa_module
from app.api.v1 import vault as vault_module
from app.api.v1 import protected_key as protected_key_module
from app.api.v1 import auth as auth_module
from app.api.v1 import mfa_recovery as mfa_recovery_module

from app.database import engine, get_db, Base
from app.models.user import User
from app.models.vault_entry import VaultEntry
from app.models.audit_log import AuditLog

# --- SECURITY CONFIGURATION ---
pwd_context = CryptContext(schemes=["bcrypt"], bcrypt__rounds=12, deprecated="auto")
ACCESS_TOKEN_EXPIRE_MINUTES = 60

logger = logging.getLogger("smartcare")
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="SmartCare Backend")

# --- CORS (must be first middleware) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=getattr(settings, 'ALLOWED_ORIGINS', []),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- GLOBAL USER IP FIX ---
# Only trust X-Forwarded-For when the connecting peer is a known, trusted proxy.
def get_client_ip(request: Request):
    forwarded = request.headers.get("x-forwarded-for")
    peer = request.client.host
    trusted = getattr(settings, 'TRUSTED_PROXIES', []) or []
    if forwarded and peer in trusted:
        return forwarded.split(",")[0].strip()
    return peer

# --- RATE LIMITER ---
# Use get_client_ip so rate limits are keyed by true client IP (when trusted proxy present)
limiter = Limiter(key_func=get_client_ip)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

# Custom Handler (Fixes the ImportError crash)
def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please try again later."},
    )

app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# --- 405 Method Not Allowed handler (log origin & method) ---
def method_not_allowed_handler(request: Request, exc: Exception):
    origin = request.headers.get('origin') or request.headers.get('referer')
    logger.warning(f"405 Method Not Allowed - origin={origin} method={request.method} path={request.url.path} cause={type(exc).__name__}")
    http_exc = HTTPException(status_code=405, detail="Method not allowed")
    return JSONResponse(status_code=http_exc.status_code, content={"detail": http_exc.detail})

app.add_exception_handler(HTTPException, lambda request, exc: JSONResponse(status_code=exc.status_code, content={"detail": exc.detail}))

# Log validation errors (422) including raw request body and headers to aid debugging
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    try:
        body_bytes = await request.body()
        body_preview = body_bytes.decode('utf-8', errors='replace')[:2000]
    except Exception:
        body_preview = '<unable to read body>'
    headers = dict(request.headers)
    logger.error(f"RequestValidationError on {request.url.path} from origin={headers.get('origin')} method={request.method} body_preview={body_preview}")
    return JSONResponse(status_code=422, content={"detail": exc.errors()})

app.add_exception_handler(RequestValidationError, validation_exception_handler)

# --- ROUTER REGISTRATION ---
app.include_router(signaling_module.router)
app.include_router(dashboard_module.router, prefix="/api/v1/patient")
app.include_router(appointments_module.router, prefix="/api/v1/appointments")
app.include_router(medical_records_module.router, prefix="/api/v1/medical-records")
app.include_router(tele_module.router, prefix="/api/v1/tele")
app.include_router(admin_module.router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(files_module.router, prefix="/api/v1/files", tags=["Files"])
app.include_router(video_module.router, prefix="/api/v1/video", tags=["Video"]) # <--- ADD THIS
app.include_router(mfa_module.router, prefix="/api/v1/mfa", tags=["MFA"])
app.include_router(vault_module.router, prefix="/api/v1/vault", tags=["Vault"])
app.include_router(protected_key_module.router, prefix="/api/v1/keys", tags=["Keys"])
app.include_router(auth_module.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(mfa_recovery_module.router, prefix="/api/v1/mfa/recovery", tags=["MFA-Recovery"])

# --- SHARED SCHEMAS ---
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    # Wrapped master key fields (stored server-side but encrypted)
    encrypted_master_key: Optional[str] = None
    key_encryption_iv: Optional[str] = None
    key_derivation_salt: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict
    # Optional key blob returned to the client on login
    key_data: Optional[dict] = None

class ChatRequest(BaseModel):
    message: str

# --- EVENTS ---
@app.on_event("startup")
async def startup_event():
    logger.info("SmartCare Backend starting")

    # Fail-secure checks: require cryptographic secrets and perform PEM sanity checks
    missing = []
    if not getattr(settings, 'PRIVATE_KEY', None):
        missing.append('PRIVATE_KEY')
    if not getattr(settings, 'PUBLIC_KEY', None):
        missing.append('PUBLIC_KEY')
    if not getattr(settings, 'ENCRYPTION_KEY', None):
        missing.append('ENCRYPTION_KEY')

    # Basic PEM sanity checks: accept common PEM headers (RSA or PKCS8) and handle multi-line strings
    pk = getattr(settings, 'PRIVATE_KEY', '') or ''
    pub = getattr(settings, 'PUBLIC_KEY', '') or ''

    def _looks_like_private_pem(s: str) -> bool:
        s = s.strip()
        if not s:
            return False
        if 'BEGIN' not in s:
            return False
        # Accept 'PRIVATE KEY' or 'RSA PRIVATE KEY'
        if 'PRIVATE KEY' in s or 'RSA PRIVATE KEY' in s:
            return True
        return False

    def _looks_like_public_pem(s: str) -> bool:
        s = s.strip()
        if not s:
            return False
        if 'BEGIN' not in s:
            return False
        if 'PUBLIC KEY' in s:
            return True
        return False

    if pk and not _looks_like_private_pem(pk):
        logger.error('PRIVATE_KEY does not appear to be a valid PEM (missing BEGIN/PRIVATE KEY)')
        missing.append('PRIVATE_KEY')
    if pub and not _looks_like_public_pem(pub):
        logger.error('PUBLIC_KEY does not appear to be a valid PEM (missing BEGIN/PUBLIC KEY)')
        missing.append('PUBLIC_KEY')

    if missing:
        logger.critical(f'Missing or malformed required secrets: {", ".join(sorted(set(missing)))}')
        raise SystemExit(1)

    # 1. More informative CORS check
    configured_origins = getattr(settings, 'ALLOWED_ORIGINS', []) or []
    production_origin = "https://smartcare-six.vercel.app"

    # Trim accidental whitespace from configured origins before comparing
    current_origins = [o.strip() for o in configured_origins]

    if production_origin not in current_origins:
        logger.critical(f"SECURITY ALERT: Production origin {production_origin} is not in ALLOWED_ORIGINS!")
        # Only exit if we are running in production environment
        if getattr(settings, 'ENVIRONMENT', '').lower() == 'production':
            raise SystemExit(1)

    # 2. Key Presence Check
    if not getattr(settings, 'PRIVATE_KEY', None) or 'BEGIN' not in (getattr(settings, 'PRIVATE_KEY', '') or ''):
        logger.critical("PRIVATE_KEY is missing or malformed PEM")
        raise SystemExit(1)

    logger.info('Verifying database tables...')
    Base.metadata.create_all(bind=engine)
    logger.info('Database connection established')
    
    if getattr(settings, "REDIS_URL", None):
        try:
            import asyncio
            asyncio.create_task(signaling_module.manager.start_redis_listener())
            logger.info('Redis signaling listener active')
        except Exception as e:
            logger.warning('Redis listener warning (masked)')

# --- UTILITIES ---
def create_access_token(subject: str, role: Optional[str] = None) -> str:
    """Create a minimal RS256 JWT for session use.

    Tokens intentionally contain minimal claims (`sub`, `exp`, optional `role`) to
    avoid embedding PII such as email addresses.
    """
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": subject, "exp": expire}
    if role:
        to_encode["role"] = role
    # Use RS256 with server-side PRIVATE_KEY (PEM). PRIVATE_KEY must be present in env.
    return jwt.encode(to_encode, settings.PRIVATE_KEY, algorithm="RS256")

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# --- PUBLIC ENDPOINTS ---
@app.get("/health")
def health_check():
    return {"status": "ok", "service": "SmartCare API", "version": "1.0.0"}

@app.get("/")
def root():
    return {"status": "online"}

@app.post("/api/v1/chat")
async def chat_endpoint(payload: ChatRequest):
    resp = await ChatbotService.get_response(payload.message)
    return {"response": resp}

@app.get("/api/v1/doctors")
def list_doctors(db=Depends(get_db)):
    doctors = db.query(User).filter(User.role == 'doctor').all()
    return [{
        "id": d.id,
        "full_name": getattr(d, 'full_name', d.email),
        "specialization": getattr(d, 'specialization', 'General Specialist'),
    } for d in doctors]

# --- AUTH ENDPOINTS (FIXED) ---

@limiter.limit("5/minute")
@app.post("/api/v1/auth/register", status_code=201)
# CRITICAL FIX: Added 'request: Request'. This prevents the crash.
def register(request: Request, payload: RegisterRequest, db=Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
        role="patient",
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Store encrypted master key in isolated vault table if provided
    if payload.encrypted_master_key:
        ve = VaultEntry(
            user_id=new_user.id,
            encrypted_master_key=payload.encrypted_master_key,
            key_encryption_iv=payload.key_encryption_iv,
            key_derivation_salt=payload.key_derivation_salt,
        )
        db.add(ve)
        db.commit()

    return {"id": new_user.id, "email": new_user.email, "message": "Registration successful"}

@limiter.limit("5/minute")
@app.post("/api/v1/auth/login")
# CRITICAL FIX: Added 'request: Request'. This prevents the crash.
def login(request: Request, payload: LoginRequest, db=Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    role = getattr(user, 'role', 'patient')
    # Enforce MFA setup for privileged roles (doctors)
    if role == 'doctor' and not getattr(user, 'mfa_totp_secret', None):
        # Allow a short grace period (3 logins) for doctors to enable MFA.
        if getattr(user, 'mfa_grace_count', 0) < 3:
            # Increment grace counter and log high-severity audit entry
            try:
                user.mfa_grace_count = (user.mfa_grace_count or 0) + 1
                db.add(user)
                db.commit()
                db.refresh(user)
                audit = AuditLog(user_id=user.id, target_id=user.id, action='MFA_GRACE_USED', resource_type='User', ip_address=request.client.host)
                db.add(audit)
                db.commit()
            except Exception:
                db.rollback()
        else:
            # Require the doctor to set up TOTP MFA before allowing cookie issuance
            raise HTTPException(status_code=428, detail="MFA_SETUP_REQUIRED")

    token = create_access_token(subject=str(user.id), role=role)

    # Set HttpOnly, Secure cookie with SameSite=Strict to prevent XSS/CSRF token theft
    resp = {
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": getattr(user, 'full_name', None),
            "role": role,
        }
    }
    response = JSONResponse(content={"user": resp["user"]})
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path='/'
    )
    return response


@app.get("/api/v1/auth/me")
def me(request: Request, db=Depends(get_db)):
    # Read token from HttpOnly cookie set at login
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, settings.PUBLIC_KEY, algorithms=["RS256"])
        sub = payload.get('sub')
        if not sub:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        user = db.query(User).filter(User.id == str(sub)).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return {"user": {"id": user.id, "email": user.email, "full_name": getattr(user, 'full_name', None), "role": getattr(user, 'role', 'patient')}}
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


@app.post("/api/v1/auth/logout")
def logout():
    response = JSONResponse(content={"message": "logged out"})
    response.delete_cookie("access_token", path='/')
    return response