from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from app.tasks.audit import record_audit_async
from app.signaling import router as signaling_router
from app.api.v1 import ehr, appointments, availability, profile, auth, tele, finance
import os
from typing import List

from fastapi.middleware.cors import CORSMiddleware

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


# Simple rule-based chatbot responses
def get_chatbot_response(message: str) -> str:
    """Simple keyword-based chatbot for healthcare queries."""
    msg_lower = message.lower()
    
    # Greetings
    if any(word in msg_lower for word in ['hello', 'hi', 'hey', 'greetings']):
        return "Hello! I'm SmartCare Assistant. I can help you with appointment booking, general health information, and navigating our services. How can I assist you today?"
    
    # Appointments
    if any(word in msg_lower for word in ['appointment', 'book', 'schedule', 'doctor']):
        return "To book an appointment, please navigate to the 'Book Appointment' section in the menu. You can choose your preferred doctor, date, and time. Would you like me to guide you through the process?"
    
    # Hours/Contact
    if any(word in msg_lower for word in ['hours', 'open', 'time', 'contact', 'phone']):
        return "Our clinic is open Monday-Friday 8:00 AM - 6:00 PM, and Saturday 9:00 AM - 2:00 PM. For urgent matters, you can reach us at our 24/7 helpline. You can find contact details in the 'Contact' section."
    
    # Medical records
    if any(word in msg_lower for word in ['record', 'history', 'medical', 'report']):
        return "You can access your medical records in the 'Medical Records' section of your dashboard. All your test results, prescriptions, and visit history are securely stored there."
    
    # Payments/Billing
    if any(word in msg_lower for word in ['payment', 'bill', 'invoice', 'cost', 'price']):
        return "You can view and manage your bills in the 'Financial Hub' section. We accept various payment methods including credit cards, insurance, and online payments."
    
    # Emergency
    if any(word in msg_lower for word in ['emergency', 'urgent', 'help', 'pain']):
        return "⚠️ If this is a medical emergency, please call emergency services immediately (911 or your local emergency number). For urgent but non-emergency care, please visit our 'Contact' page for our 24/7 helpline."
    
    # Video consultation
    if any(word in msg_lower for word in ['video', 'call', 'online', 'teleconsult']):
        return "We offer video consultations! You can schedule a video appointment through the 'Teleconsultation' section. Make sure you have a stable internet connection and a camera-enabled device."
    
    # Default response
    return "I'm here to help! You can ask me about:\n• Booking appointments\n• Clinic hours and contact info\n• Accessing medical records\n• Payment and billing\n• Video consultations\n\nWhat would you like to know?"

# WebSocket endpoint for real-time chatbot
@app.websocket("/ws/chatbot")
async def websocket_chatbot(websocket: WebSocket):
    await websocket.accept()
    
    try:
        while True:
            data = await websocket.receive_text()
            response = get_chatbot_response(data)
            await websocket.send_text(response)
    except WebSocketDisconnect:
        pass

