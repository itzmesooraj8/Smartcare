from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import json
from app.services.chatbot import ChatbotService

router = APIRouter()


class NotesRequest(BaseModel):
    transcript: str


@router.post("/generate-notes")
async def generate_notes(payload: NotesRequest):
    if not payload.transcript or not payload.transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript is required")

    system_prompt = (
        "You are a medical scribe. Convert the following transcript into a SOAP Note (Subjective, Objective, Assessment, Plan). "
        "Return the result as a JSON object with keys: subjective, objective, assessment, plan. Be concise and clinical.\n\n"
    )

    prompt = f"{system_prompt}Transcript:\n{payload.transcript}\n\nProvide the SOAP Note in JSON."

    resp_text = await ChatbotService.get_response(prompt)

    # Try to parse response as JSON; if parsing fails, return raw text under 'text'
    try:
        parsed = json.loads(resp_text)
        return {"notes": parsed}
    except Exception:
        return {"notes": {"text": resp_text}}


@router.get("/config/ice-servers")
def get_ice_servers():
    """Return ICE server configuration for WebRTC clients.

    This is a mocked response for the MVP. Replace with a real
    provider integration (e.g., Twilio, Coturn) in production.
    """
    # Example public STUN/TURN entries. TURN entries here are metered public relays
    # and are provided for demo-only purposes. Replace with your TURN provider.
    ice_servers = {
        "iceServers": [
            {"urls": ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"]},
            {"urls": ["turn:openrelay.metered.ca:80"], "username": "openrelayproject", "credential": "openrelayproject"},
            {"urls": ["turn:openrelay.metered.ca:443"], "username": "openrelayproject", "credential": "openrelayproject"}
        ]
    }
    return ice_servers
