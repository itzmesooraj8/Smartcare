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
            "gemini-1.0-pro-latest"
        ]

        last_error = None

        for model_name in candidate_models:
            try:
                logger.info(f"Attempting to use model: {model_name}")
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(message)
                
                # If we get here, it worked!
                return response.text
                
            except Exception as e:
                logger.warning(f"Model {model_name} failed: {str(e)}")
                last_error = e
                continue # Try the next model

        # If ALL models fail, log the available ones for debugging
        logger.error("All models failed. Listing available models for this key:")
        try:
            for m in genai.list_models():
                if 'generateContent' in m.supported_generation_methods:
                    logger.error(f"Available: {m.name}")
        except Exception as list_e:
            logger.error(f"Could not list models: {str(list_e)}")

        raise HTTPException(
            status_code=500,
            detail=f"AI Error: No working models found. Last error: {str(last_error)}"
        )
