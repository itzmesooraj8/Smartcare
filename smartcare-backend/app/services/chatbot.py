import os
from google import genai
from fastapi import HTTPException
import logging

# Configure simple logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ChatbotService:
    @staticmethod
    async def get_response(message: str) -> str:
        # Safety guard: ensure enterprise/BAA-enabled mode before sending any PHI to external models.
        # Operators MUST set GEMINI_ENTERPRISE=true and GEMINI_BAA_SIGNED=true when using Google Vertex/Enterprise.
        use_enterprise = os.getenv("GEMINI_ENTERPRISE", "false").lower() in ("1", "true", "yes")
        baa_signed = os.getenv("GEMINI_BAA_SIGNED", "false").lower() in ("1", "true", "yes")

        if not (use_enterprise and baa_signed):
            logger.warning("External AI is disabled: enterprise BAA mode not enabled. Request blocked.")
            raise HTTPException(status_code=503, detail="AI service disabled for PHI protection")

        # 1. Check for API Key
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            logger.error("GEMINI_API_KEY is missing.")
            raise HTTPException(status_code=500, detail="Configuration Error: API Key Missing")

        # Proceed with enterprise/BAA usage only
        try:
            # 2. Configure and create the google-genai client
            client = genai.Client(api_key=api_key)

            # 3. Use the configured enterprise/vertex model
            model_name = os.getenv("GEMINI_MODEL", "models/gemini-2.0")

            # Avoid logging user-provided content (may contain PHI). Log only redacted indicator.
            logger.info("Sending request to Gemini Enterprise (message redacted)")

            # 4. Generate Content using google-genai
            # The new SDK exposes a models.generate_content method.
            response = client.models.generate_content(model=model_name, contents=message)

            # Normalize response to extract text and optional confidence safely.
            text = None
            score = None

            # Response may be an object or dict depending on SDK version; try common shapes.
            try:
                if hasattr(response, 'candidates') and response.candidates:
                    cand = response.candidates[0]
                    text = getattr(cand, 'content', None) or getattr(cand, 'text', None)
                    score = getattr(cand, 'confidence', None) or getattr(cand, 'score', None)
                elif isinstance(response, dict):
                    if response.get('candidates'):
                        cand = response['candidates'][0]
                        text = cand.get('content') or cand.get('text')
                        score = cand.get('confidence') or cand.get('score')
                    else:
                        text = response.get('text') or response.get('output') or str(response)
                        score = response.get('confidence') or response.get('score')
                else:
                    text = getattr(response, 'text', str(response))
            except Exception:
                text = str(response)

            confidence = float(score) if score is not None else 0.9

            disclaimer = (
                "\n\n[Automated Clinical Assistant — for informational purposes only. "
                "Not a substitute for professional medical advice. Verify with a clinician.]"
            )

            combined = f"{text}{disclaimer}"

            result = {
                "text": combined,
                "confidence_score": confidence,
                "requires_human_review": confidence < 0.8,
            }

            return result

        except Exception:
            # Avoid logging exception details that may include PHI or sensitive payloads.
            logger.error("Gemini Enterprise API Error (redacted)")
            raise HTTPException(status_code=500, detail="AI service error")