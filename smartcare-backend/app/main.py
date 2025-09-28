from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from app.tasks.audit import record_audit_async
from app.signaling import router as signaling_router
from app.api.v1 import ehr, appointments, availability, profile, auth, tele
import os
from huggingface_hub import InferenceClient
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Smartcare Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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

# WebSocket endpoint for real-time chatbot
@app.websocket("/ws/chatbot")
async def websocket_chatbot(websocket: WebSocket):
    await websocket.accept()
    token = os.getenv("HF_API_TOKEN")
    client = InferenceClient("microsoft/Phi-3-mini-4k-instruct", token=token)
    try:
        while True:
            data = await websocket.receive_text()
            # Call Hugging Face API (streaming not supported in websocket, so send full reply)
            response = "".join(
                message.choices[0].delta.content for message in client.chat_completion(
                    messages=[{"role": "user", "content": data}],
                    max_tokens=200,
                    stream=True,
                )
            )
            await websocket.send_text(response)
    except WebSocketDisconnect:
        pass
