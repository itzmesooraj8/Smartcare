import os
import google.generativeai as genai
from fastapi import HTTPException
import logging

# Setup logging to see errors in Render logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ChatbotService:
    @staticmethod
    async def get_response(message: str) -> str:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            logger.error("CRITICAL: GEMINI_API_KEY is missing from environment variables.")
            raise HTTPException(status_code=500, detail="Server Configuration Error: API Key Missing")

        try:
            # Configure Gemini
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-1.5-flash")
            
            logger.info(f"Sending request to Gemini... Message: {message}")
            
            # Generate response
            response = model.generate_content(message)
            
            # Check if the response was blocked by safety filters
            try:
                return response.text
            except ValueError:
                # If we get here, the AI refused to answer (Safety Filter)
                logger.warning(f"Safety Filter Triggered! Feedback: {getattr(response, 'prompt_feedback', None)}")
                return "I am sorry, but I cannot answer that query right now (Safety Filter Triggered)."

        except Exception as e:
            # Catch ANY other error (like invalid key, connection issues)
            logger.error(f"Gemini API Failed: {str(e)}")
            # Send the ACTUAL error details to the frontend so we can debug
            raise HTTPException(status_code=500, detail=f"AI Provider Error: {str(e)}")
