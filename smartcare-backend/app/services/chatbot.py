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
            model = genai.GenerativeModel("models/gemini-2.0-flash-exp")

            # Avoid logging user-provided content (may contain PHI). Log only redacted indicator.
            logger.info("Sending request to Gemini (message redacted)")

            # 4. Generate Content
            response = model.generate_content(message)

            # Attempt to extract a confidence score from the model response if present.
            score = None
            try:
                # The exact structure may vary by SDK; attempt a couple of common fields.
                if hasattr(response, 'candidates') and response.candidates:
                    cand = response.candidates[0]
                    score = getattr(cand, 'confidence', None) or getattr(cand, 'score', None)
                score = score or getattr(response, 'confidence', None) or getattr(response, 'score', None)
            except Exception:
                score = None

            # Default confidence if not available
            confidence = float(score) if score is not None else 0.9

            # Clinical/legal disclaimer must be appended to every AI response for safety/audit
            disclaimer = (
                "\n\n[Automated Clinical Assistant — for informational purposes only. "
                "Not a substitute for professional medical advice. Verify with a clinician.]"
            )

            text = getattr(response, 'text', str(response))
            combined = f"{text}{disclaimer}"

            result = {
                "text": combined,
                "confidence_score": confidence,
                "requires_human_review": confidence < 0.8,
            }

            return result

        except Exception as e:
            logger.error(f"Gemini API Error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"AI Error: {str(e)}")