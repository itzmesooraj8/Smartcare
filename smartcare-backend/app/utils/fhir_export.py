from __future__ import annotations
from typing import Dict, Any
import hashlib
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.medical_record import MedicalRecord
from app.core.config import settings


def _pubkey_fingerprint(pub_pem: str) -> str:
    # Return SHA256 fingerprint of public key (hex)
    h = hashlib.sha256(pub_pem.encode())
    return h.hexdigest()


def _export_to_fhir_with_db(record_id: str, db: Session) -> Dict[str, Any]:
    """Fetch encrypted medical record and wrap in a FHIR Bundle.

    Args:
        record_id: UUID string of MedicalRecord
        db: SQLAlchemy Session

    Returns:
        Dict representing a FHIR Bundle containing the encrypted payload and metadata.
    """
    mr = db.query(MedicalRecord).filter(MedicalRecord.id == record_id).first()
    if not mr:
        raise ValueError("MedicalRecord not found")

    # The client-side encrypted blob should be included as-is; place inside an Observation
    obs = {
        "resourceType": "Observation",
        "id": mr.id,
        "status": "final",
        "effectiveDateTime": mr.effective_date or datetime.utcnow().isoformat(),
        "subject": {"reference": f"Patient/{mr.patient_id}"},
        "performer": [{"reference": f"Practitioner/{mr.doctor_id}"}] if mr.doctor_id else [],
        "valueString": mr.value_string,
        "extension": [
            {"url": "http://smartcare.local/EncryptedPayload", "valueString": mr.value_string}
        ],
    }

    bundle = {
        "resourceType": "Bundle",
        "type": "collection",
        "timestamp": datetime.utcnow().isoformat(),
        "entry": [
            {"resource": obs},
        ],
        "meta": {
            "source": "SmartCare",
            "public_key_fingerprint": _pubkey_fingerprint(settings.PUBLIC_KEY or "")
        }
    }

    return bundle


def export_to_fhir(record_id: str, db: Session | None = None) -> Dict[str, Any]:
    """Fetch encrypted medical record and wrap in a FHIR Bundle.

    Args:
        record_id: UUID string of MedicalRecord
        db: Optional SQLAlchemy Session. When called in an authenticated request
            context, the caller MUST pass their authenticated DB session to
            ensure queries respect RLS and SET LOCAL app.current_user_id.
            If omitted, a standalone SessionLocal() is created strictly for
            offline/admin CLI exports.

    Returns:
        FHIR Bundle as dict
    """
    if db is not None:
        return _export_to_fhir_with_db(record_id, db)

    from app.database import SessionLocal
    standalone_db = SessionLocal()
    try:
        return _export_to_fhir_with_db(record_id, standalone_db)
    finally:
        standalone_db.close()


def export_to_fhir_by_id(record_id: str, db: Session | None = None) -> Dict[str, Any]:
    """Backward-compatible alias for export_to_fhir(record_id, db)."""
    return export_to_fhir(record_id, db=db)
