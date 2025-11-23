from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from app.tasks.audit import record_audit_async
from app.signaling import router as signaling_router
from app.api.v1 import ehr, appointments, availability, profile, auth, tele, finance
from app.services.chatbot import ChatbotService
import os
from typing import List
import json
import logging

from fastapi.middleware.cors import CORSMiddleware

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Smartcare Backend")

# Production root endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to Smartcare Backend. API is running."}

# Health check endpoint
@app.get("/health")
async def health():
    return {"status": "ok"}


def _build_allowed_origins() -> List[str]:
    """Compose the CORS allow list from defaults + env overrides."""
    defaults = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://localhost:3000",
        "https://localhost:5173",
    ]

    frontend_url = os.getenv("FRONTEND_URL")
    extra_origins = os.getenv("ADDITIONAL_ORIGINS", "")

    if frontend_url:
        defaults.append(frontend_url.rstrip("/"))

    if extra_origins:
        defaults.extend([
            origin.strip().rstrip("/")
            for origin in extra_origins.split(",")
            if origin.strip()
        ])

    # Remove duplicates while preserving order
    seen = set()
    cleaned = []
    for origin in defaults:
        if origin not in seen:
            cleaned.append(origin)
            seen.add(origin)
    return cleaned


app.add_middleware(
    CORSMiddleware,
    allow_origins=_build_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(ehr.router, prefix="/api/v1/ehr", tags=["EHR"])
app.include_router(appointments.router, prefix="/api/v1/appointments", tags=["Appointments"])
app.include_router(availability.router, prefix="/api/v1/availability", tags=["Availability"])
app.include_router(profile.router, prefix="/api/v1/profile", tags=["Profile"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(tele.router, prefix="/api/v1/tele", tags=["Telemedicine"])
app.include_router(finance.router, prefix="/api/v1/finance", tags=["Finance"])
app.include_router(signaling_router)

@app.middleware("http")
async def audit_middleware(request: Request, call_next):
    response = await call_next(request)
    try:
        user = request.state.user if hasattr(request.state, "user") else None
        record_audit_async.delay({
            "path": request.url.path,
            "method": request.method,
            "status": response.status_code,
            "user": getattr(user, "id", None),
            "ip": request.client.host if request.client else None
        })
    except Exception:
        pass
    return response


# WebSocket endpoint for real-time chatbot with conversation history
@app.websocket("/ws/chatbot")
async def websocket_chatbot(websocket: WebSocket):
    """
    WebSocket endpoint for real-time chatbot communication.
    Maintains conversation history for context-aware responses.
    """
    await websocket.accept()
    conversation_history = []
    
    try:
        # Send welcome message
        welcome_msg = "Hi! I'm SmartCare Assistant. I can help you with appointments, billing, medical records, and general health information. How can I assist you today?"
        await websocket.send_text(welcome_msg)
        
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            
            # Add user message to history
            conversation_history.append({
                "sender": "user",
                "content": data
            })
            
            # Get AI/rule-based response
            try:
                response = await ChatbotService.get_response(data, conversation_history)
                
                # Add bot response to history
                conversation_history.append({
                    "sender": "bot",
                    "content": response
                })
                
                # Send response to client
                await websocket.send_text(response)
                
                # Keep conversation history manageable (last 20 messages)
                if len(conversation_history) > 20:
                    conversation_history = conversation_history[-20:]
                    
            except Exception as e:
                logger.error(f"Error generating chatbot response: {e}")
                error_msg = "I apologize, but I'm having trouble processing your request. Please try again or contact our support team."
                await websocket.send_text(error_msg)
                
    except WebSocketDisconnect:
        logger.info("Chatbot WebSocket disconnected")
    except Exception as e:
        logger.error(f"Chatbot WebSocket error: {e}")
        try:
            await websocket.close()
        except:
            pass

