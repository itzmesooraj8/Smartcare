import os
import asyncio
import google.generativeai as genai
from fastapi import HTTPException


class ChatbotService:
    @staticmethod
    async def get_response(message: str) -> str:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="Server Configuration Error: GEMINI_API_KEY is missing.")

        try:
            genai.configure(api_key=api_key)

            # Run blocking Gemini call in a thread to avoid blocking the event loop
            loop = asyncio.get_event_loop()

            def call_gemini():
                model = genai.GenerativeModel("gemini-pro")
                # `generate_content` is used per example; handle returned shape
                resp = model.generate_content(message)
                # Try common attribute names
                if hasattr(resp, "text") and resp.text:
                    return resp.text
                # Fallback to string conversion
                return str(resp)

            result = await loop.run_in_executor(None, call_gemini)
            return result or "I'm sorry, I couldn't generate a response."

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"AI Provider Error: {e}")
