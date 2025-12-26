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
