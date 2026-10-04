import logging
import uuid
from typing import Optional

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address
from sqlalchemy import text

from app.core.config import settings
from app.core.security import verify_jwt
from app.database import engine, Base, transactional_session

# Router Imports
from app.api.v1 import (
    dashboard as dashboard_module,
    appointments as appointments_module,
    medical_records as medical_records_module,
    files as files_module,
    auth as auth_module,
    admin as admin_module,
    doctors as doctors_module,
    patients as patients_module,
    video as video_module,
    vault as vault_module,
    tele as tele_module,
    mfa as mfa_module,
    mfa_recovery as mfa_recovery_module,
    protected_key as protected_key_module,
)
from app import signaling as signaling_module

logger = logging.getLogger("smartcare")

app = FastAPI(
    title="SmartCare Backend",
    version="1.0.0",
    docs_url="/docs" if getattr(settings, "ENVIRONMENT", "").lower() != "production" else None,
    redoc_url="/redoc" if getattr(settings, "ENVIRONMENT", "").lower() != "production" else None,
)

# --- CORS SETTINGS ---
ORIGINS = list(getattr(settings, "BACKEND_CORS_ORIGINS", []))

app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_context_middleware(request: Request, call_next):
    """
    Assigns a unique correlation ID to every incoming HTTP request
    and populates request.state.request_id for diagnostics and auditing.
    """
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


@app.middleware("http")
async def inject_current_user(request: Request, call_next):
    """
    Decodes the JWT using centralized verify_jwt from app.core.security.
    Extracts user identity from Authorization header (Bearer) or access_token cookie.
    Populates request.state.current_user_id and request.state.token_scopes for downstream consumers.
    """
    request.state.current_user_id = None
    request.state.token_scopes = []
    token = None

    # 1. Priority: Check Authorization: Bearer <token>
    auth = request.headers.get("Authorization")
    if auth and auth.lower().startswith("bearer "):
        token = auth.split(" ", 1)[1]

    # 2. Fallback: Check HttpOnly cookie
    if not token:
        try:
            token = request.cookies.get("access_token")
        except Exception:
            pass

    if token:
        try:
            payload = verify_jwt(token)
            sub = payload.get("sub")
            if sub:
                request.state.current_user_id = str(sub)
                request.state.token_scopes = payload.get("scopes", [])
        except Exception:
            request.state.current_user_id = None
            request.state.token_scopes = []

    response = await call_next(request)
    return response


@app.middleware("http")
async def audit_sensitive_reads(request: Request, call_next):
    """
    Lightweight middleware to record read access to sensitive resources.
    Persists an audit event using the authenticated transaction identity
    via the trusted SECURITY DEFINER function log_user_audit_event().
    Direct ORM inserts and fail-open fallbacks are strictly prohibited.
    """
    response = await call_next(request)
    if response.status_code < 400 and request.method == "GET" and request.url.path.startswith("/api/v1/medical-records"):
        user_id = getattr(request.state, "current_user_id", None)
        if user_id:
            ip_addr = request.client.host if request.client else None
            with transactional_session(user_id=str(user_id)) as db:
                db.execute(
                    text("SELECT public.log_user_audit_event(:action, :res, NULL, :ip)"),
                    {"action": "READ", "res": "MEDICAL_RECORDS", "ip": ip_addr}
                )

    return response


limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Enterprise Safe Exception Handler:
    Logs full diagnostic traceback internally with correlation request_id.
    Returns a sanitized, non-disclosing error envelope to client.
    Never exposes internal SQL errors, file paths, or stack traces.
    """
    request_id = getattr(request.state, "request_id", None) or str(uuid.uuid4())
    logger.error("Unhandled exception [request_id=%s] on %s %s: %s", request_id, request.method, request.url.path, exc, exc_info=True)

    origin = request.headers.get("origin")
    allow_origin = origin if origin in ORIGINS else (ORIGINS[0] if ORIGINS else "*")

    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred. Please contact support with the request ID.",
                "request_id": request_id,
            }
        },
        headers={
            "Access-Control-Allow-Origin": allow_origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
            "X-Request-ID": request_id,
        },
    )


@app.on_event("startup")
async def startup_event():
    try:
        if engine.dialect.name == "sqlite":
            Base.metadata.create_all(bind=engine)
            logger.info("Local SQLite database tables initialized.")
        else:
            logger.info("Production PostgreSQL schema managed via Supabase migrations; skipping create_all.")
        logger.info("Application startup sequence completed successfully.")
    except Exception as exc:
        logger.error("Database connection/init deferred: %s", exc)


# --- ROUTER REGISTRATION ---
app.include_router(signaling_module.router)
app.include_router(auth_module.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(dashboard_module.router, prefix="/api/v1/patient", tags=["Dashboard"])
app.include_router(medical_records_module.router, prefix="/api/v1/medical-records", tags=["Records"])
app.include_router(files_module.router, prefix="/api/v1/files", tags=["Files"])
app.include_router(appointments_module.router, prefix="/api/v1/appointments", tags=["Appointments"])
app.include_router(admin_module.router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(doctors_module.router, prefix="/api/v1/doctors", tags=["Doctors"])
app.include_router(patients_module.router, prefix="/api/v1/patients", tags=["Patients"])
app.include_router(video_module.router, prefix="/api/v1/video", tags=["Video"])
app.include_router(vault_module.router, prefix="/api/v1/vault", tags=["Vault"])
app.include_router(tele_module.router, prefix="/api/v1/tele", tags=["Telehealth"])
app.include_router(mfa_module.router, prefix="/api/v1/mfa", tags=["MFA"])
app.include_router(mfa_recovery_module.router, prefix="/api/v1/mfa-recovery", tags=["MFA Recovery"])
app.include_router(protected_key_module.router, prefix="/api/v1/protected-key", tags=["Protected Key"])


@app.get("/")
def root():
    return {"status": "online", "environment": getattr(settings, "ENVIRONMENT", "production"), "service": "SmartCare AI"}


@app.get("/health")
@app.get("/api/v1/health")
def health():
    return {"status": "healthy", "service": "smartcare-backend"}