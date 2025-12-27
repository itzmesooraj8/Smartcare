from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import json
import os
from sqlalchemy.orm import Session
from app.services.chatbot import ChatbotService
from app.database import get_db
from app.models.medical_record import MedicalRecord
from app.core.encryption import decrypt_text

router = APIRouter()


class NotesRequest(BaseModel):
    transcript: str
    # The patient id whose history should be cross-referenced
    patient_id: str


@router.post("/generate-notes")
async def generate_notes(payload: NotesRequest, db: Session = Depends(get_db)):
    if not payload.transcript or not payload.transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript is required")
    if not payload.patient_id:
        raise HTTPException(status_code=400, detail="patient_id is required for cross-referencing history")

    # Fetch patient's recent medical records to include in the LLM prompt for cross-referencing
    try:
        records = db.query(MedicalRecord).filter_by(patient_id=payload.patient_id).order_by(MedicalRecord.created_at.desc()).limit(50).all()
    except Exception:
        records = []

    history_lines = []
    for r in records:
        try:
            diag = decrypt_text(r.diagnosis) if r.diagnosis else ''
        except Exception:
            diag = r.diagnosis or ''
        try:
            notes = decrypt_text(r.notes) if getattr(r, 'notes', None) else ''
        except Exception:
            notes = getattr(r, 'notes', '')
        history_lines.append(f"- {r.created_at.isoformat() if r.created_at else ''} | {r.title} | Diagnosis: {diag} | Notes: {notes}")

    history_text = '\n'.join(history_lines) if history_lines else 'No prior records available.'

    system_prompt = (
        "You are a careful medical scribe. Convert the following transcript into a SOAP Note (Subjective, Objective, Assessment, Plan). "
        "CROSS-REFERENCE the patient's existing history provided below. If a NEW medication or intervention is mentioned that conflicts with the patient's history, add a top-level '⚠️ SAFETY ALERT' section explaining the conflict and recommended immediate actions for the clinician. "
        "Return the result as a JSON object with keys: safety_alert (optional), subjective, objective, assessment, plan. If no safety issues, safety_alert should be null. Be concise, clinical, and cite relevant history lines when noting conflicts.\n\n"
    )

    prompt = f"{system_prompt}\nPatient History:\n{history_text}\n\nTranscript:\n{payload.transcript}\n\nProvide the SOAP Note (JSON) and include a 'safety_alert' key when applicable."

    resp_text = await ChatbotService.get_response(prompt)

    # Try to parse response as JSON; if parsing fails, return raw text under 'text'
    try:
        parsed = json.loads(resp_text)
        return {"notes": parsed}
    except Exception:
        return {"notes": {"text": resp_text}}


@router.get("/config/ice-servers")
def get_ice_servers():
    """Returns a list of Free Public STUN servers.

    This requires NO credit card and works for most P2P connections.
    """
    # Robust list of free public STUN servers
    ice_servers = [
        {"urls": ["stun:stun.l.google.com:19302"]},
        {"urls": ["stun:stun1.l.google.com:19302"]},
        {"urls": ["stun:stun2.l.google.com:19302"]},
        {"urls": ["stun:stun3.l.google.com:19302"]},
        {"urls": ["stun:stun4.l.google.com:19302"]},
    ]
    return {"iceServers": ice_servers}


@router.get("/credentials")
def get_ice_credentials():
    """Return ICE configuration. If TURN server vars are configured, return TURN credentials too.

    Environment variables supported:
    - TURN_SERVER_URL (stun/turn URL)
    - TURN_USER
    - TURN_PASS
    If not provided, returns public STUN servers only.
    """
    ice_servers = [
        {"urls": ["stun:stun.l.google.com:19302"]},
        {"urls": ["stun:stun1.l.google.com:19302"]},
    ]

    turn_url = os.getenv("TURN_SERVER_URL")
    turn_user = os.getenv("TURN_USER")
    turn_pass = os.getenv("TURN_PASS")
    if turn_url and turn_user and turn_pass:
        # Single TURN server entry with credential
        ice_servers.append({"urls": [turn_url], "username": turn_user, "credential": turn_pass})

    return {"iceServers": ice_servers}
