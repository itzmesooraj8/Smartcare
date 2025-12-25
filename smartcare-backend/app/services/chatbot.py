import os
import google.generativeai as genai
from fastapi import HTTPException
import logging

# Configure simple logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ChatbotService:
    @staticmethod
    async def get_response(message: str) -> str:
        # 1. Check for API Key
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            logger.error("GEMINI_API_KEY is missing.")
            raise HTTPException(status_code=500, detail="Configuration Error: API Key Missing")

        try:
            # 2. Configure the Google AI Client
            genai.configure(api_key=api_key)
            
            # 3. Use the Experimental Model (Free Tier Friendly)
            # This is the exact model string we confirmed works for your key.
            model = genai.GenerativeModel("models/gemini-2.0-flash-exp")
            
            logger.info(f"Sending request to Gemini: {message}")
            
            # 4. Generate Content
            response = model.generate_content(message)
            return response.text

        except Exception as e:
            # 5. Handle Errors (Log them for you, return 500 for the frontend)
            logger.error(f"Gemini API Error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"AI Error: {str(e)}")