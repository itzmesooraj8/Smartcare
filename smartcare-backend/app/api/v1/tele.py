from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import json
import os
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
