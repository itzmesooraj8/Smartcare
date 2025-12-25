import json
from typing import Optional
import httpx
from ..core.config import settings


SYSTEM_PROMPT = "You are the SmartCare medical assistant. Be professional, concise, and helpful with appointment scheduling and symptom checking."


class ChatbotService:
    @staticmethod
    async def get_response(message: str) -> str:
        url = "https://api.x.ai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.XAI_API_KEY}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": "grok-beta",
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": message},
            ],
            "max_tokens": 512,
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()

        # Try common response shapes, be robust to provider differences
        content: Optional[str] = None
        if isinstance(data, dict):
            choices = data.get("choices") or []
            if choices and isinstance(choices, list):
                first = choices[0]
                # common: choice.message.content
                if isinstance(first, dict):
                    msg = first.get("message") or first.get("delta")
                    if isinstance(msg, dict) and msg.get("content"):
                        content = msg.get("content")
                    elif first.get("text"):
                        content = first.get("text")
                    elif first.get("content"):
                        content = first.get("content")

        if not content:
            # fallback to stringified object
            try:
                content = json.dumps(data)
            except Exception:
                content = str(data)

        return content
