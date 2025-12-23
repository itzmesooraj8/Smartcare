"""Chatbot service using XAI/Grok (preferred) with rule-based fallback.

Secrets must remain on the backend (see `smartcare-backend/.env`). This module
prefers `GROK_API_KEY` (or `XAI_API_KEY`) if present and will call the
provider's HTTP endpoint configured via `XAI_API_URL`. If no XAI key is
available or the provider call fails, it falls back to a rule-based responder.
"""
import os
import logging
from typing import Optional
from pathlib import Path
from dotenv import load_dotenv
import httpx

# Try to explicitly load the backend .env for deterministic behavior
backend_env = Path(__file__).resolve().parents[2] / ".env"
if backend_env.exists():
    load_dotenv(dotenv_path=str(backend_env))
else:
    # fallback to any .env found on the environment
    load_dotenv()

logger = logging.getLogger(__name__)

# Prefer Grok/XAI provider if configured
GROK_API_KEY = os.getenv("GROK_API_KEY") or os.getenv("XAI_API_KEY")
XAI_API_URL = os.getenv("XAI_API_URL")  # optional, provider-specific
USE_XAI = GROK_API_KEY is not None

# Only XAI/Grok is used. If not configured, we fall back to the rule-based chatbot.
if not USE_XAI:
    model = None
    logger.warning("GROK_API_KEY/XAI_API_KEY not configured. Using rule-based chatbot.")
else:
    model = None  # kept for API parity if needed later


class ChatbotService:
    """Intelligent chatbot service with AI and rule-based fallback."""
    
    SYSTEM_PROMPT = """You are SmartCare Assistant, a helpful healthcare chatbot for the SmartCare medical platform. 
Your role is to assist patients and healthcare providers with:
- Booking and managing appointments
- Accessing medical records
- Understanding billing and payments
- Video consultations
- General health information
- Navigating the SmartCare platform

Guidelines:
- Be professional, empathetic, and concise
- For medical emergencies, always direct users to call emergency services (911)
- Don't provide specific medical diagnoses or treatment advice
- Guide users to appropriate sections of the platform
- Be helpful and friendly

Clinic hours: Monday-Friday 8:00 AM - 6:00 PM, Saturday 9:00 AM - 2:00 PM
24/7 helpline available for urgent matters.
"""

    @staticmethod
    def get_rule_based_response(message: str) -> str:
        """Fallback rule-based chatbot for when AI is unavailable."""
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
        return """I'm here to help! You can ask me about:
• Booking appointments
• Clinic hours and contact info
• Accessing medical records
• Payment and billing
• Video consultations

What would you like to know?"""

    @staticmethod
    async def get_ai_response(message: str, conversation_history: Optional[list] = None) -> str:
        """Get AI-powered response using XAI/Grok via `get_xai_response`.

        Falls back to the rule-based responder on error.
        """
        try:
                # Use XAI/Grok via HTTP endpoint if configured
                if USE_XAI and XAI_API_URL:
                    return await ChatbotService.get_xai_response(message, conversation_history)

                # If XAI is not configured or request fails, fall back to rule-based
                return ChatbotService.get_rule_based_response(message)
        except Exception as e:
            logger.error(f"AI response error: {e}")
            # Fallback to rule-based
            return ChatbotService.get_rule_based_response(message)

    @staticmethod
    async def get_xai_response(message: str, conversation_history: Optional[list] = None) -> str:
        """Call an XAI/Grok HTTP endpoint. Requires `GROK_API_KEY` and `XAI_API_URL`.

        This implementation is intentionally generic: set `XAI_API_URL` to your
        provider's chat/completion endpoint and ensure the auth header uses the
        `GROK_API_KEY` value. Adjust payload/response parsing to match the
        target API.
        """
        if not XAI_API_URL or not GROK_API_KEY:
            logger.error("XAI API URL or GROK API key not configured")
            return ChatbotService.get_rule_based_response(message)

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                payload = {
                    "input": message,
                    # Provider-specific fields go here; adapt as needed
                }
                headers = {
                    "Authorization": f"Bearer {GROK_API_KEY}",
                    "Content-Type": "application/json",
                }
                resp = await client.post(XAI_API_URL, json=payload, headers=headers)
                resp.raise_for_status()
                data = resp.json()

                # Attempt to extract text from common fields; adapt per provider
                if isinstance(data, dict):
                    # Common patterns: data['output'], data['text'], data['choices'][0]['text']
                    if "output" in data and isinstance(data["output"], str):
                        return data["output"]
                    if "text" in data and isinstance(data["text"], str):
                        return data["text"]
                    if "choices" in data and isinstance(data["choices"], list) and data["choices"]:
                        first = data["choices"][0]
                        if isinstance(first, dict) and "text" in first:
                            return first["text"]

                # As a last resort, return the raw JSON as a string
                return str(data)
        except Exception as e:
            logger.error(f"XAI request failed: {e}")
            return ChatbotService.get_rule_based_response(message)

    @staticmethod
    async def get_response(message: str, conversation_history: Optional[list] = None) -> str:
        """
        Get chatbot response - uses AI if available, otherwise falls back to rules.
        
        Args:
            message: User's message
            conversation_history: List of previous messages for context
            
        Returns:
            Chatbot response string
        """
        if not message or not message.strip():
            return "I didn't catch that. Could you please say that again?"

        # Use XAI (Grok) if available; otherwise fall back to rules
        if USE_XAI:
            return await ChatbotService.get_ai_response(message, conversation_history)

        return ChatbotService.get_rule_based_response(message)
