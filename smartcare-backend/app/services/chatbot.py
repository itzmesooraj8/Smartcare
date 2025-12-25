import os
import google.generativeai as genai
from fastapi import HTTPException
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ChatbotService:
    @staticmethod
    async def get_response(message: str) -> str:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            logger.error("CRITICAL: GEMINI_API_KEY is missing.")
            raise HTTPException(status_code=500, detail="Server Configuration Error: API Key Missing")

        genai.configure(api_key=api_key)

        # List of models to try in order of preference
        # We try specific versions first, then generic aliases
        candidate_models = [
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-pro",
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
                    api_key = os.getenv("GEMINI_API_KEY")
                    if not api_key:
                        logger.error("GEMINI_API_KEY is missing.")
                        raise HTTPException(status_code=500, detail="Configuration Error: API Key Missing")

                    try:
                        genai.configure(api_key=api_key)
            
                        # Using the Experimental model (Free Tier Friendly)
                        model = genai.GenerativeModel("models/gemini-2.0-flash-exp")
            
                        logger.info(f"Sending request to Gemini: {message}")
                        response = model.generate_content(message)
                        return response.text

                    except Exception as e:
                        logger.error(f"Gemini API Error: {str(e)}")
                        # Return a generic error to the client, but log the specific one above
                        raise HTTPException(status_code=500, detail=f"AI Error: {str(e)}")
        )
