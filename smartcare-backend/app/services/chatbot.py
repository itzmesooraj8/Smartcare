"""
Chatbot service with Google Gemini AI integration and fallback to rule-based responses.
"""
import os
import logging
from typing import Optional
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables from .env file
load_dotenv()

logger = logging.getLogger(__name__)

# Configure Gemini AI
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
USE_AI = GEMINI_API_KEY is not None

if USE_AI:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-pro')
        logger.info("Gemini AI initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Gemini AI: {e}")
        USE_AI = False
        model = None
else:
    model = None
    logger.warning("GEMINI_API_KEY not found. Using rule-based chatbot.")


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
        """Get AI-powered response using Google Gemini."""
        try:
            # Build conversation context
            chat_history = []
            if conversation_history:
                for msg in conversation_history[-10:]:  # Keep last 10 messages for context
                    role = "user" if msg.get("sender") == "user" else "model"
                    chat_history.append({
                        "role": role,
                        "parts": [msg.get("content", "")]
                    })
            
            # Start chat with history
            chat = model.start_chat(history=chat_history)
            
            # Send message with system context
            full_prompt = f"{ChatbotService.SYSTEM_PROMPT}\n\nUser: {message}"
            response = chat.send_message(full_prompt)
            
            return response.text
        except Exception as e:
            logger.error(f"AI response error: {e}")
            # Fallback to rule-based
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
        
        if USE_AI and model:
            return await ChatbotService.get_ai_response(message, conversation_history)
        else:
            return ChatbotService.get_rule_based_response(message)
