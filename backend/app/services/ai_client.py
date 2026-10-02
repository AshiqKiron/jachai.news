import httpx

from app.core.config import settings


class AIClient:
    """Thin wrapper for Groq or Gemini completion APIs."""

    async def summarize_cluster(self, headlines: list[str]) -> str:
        if not headlines:
            return ""

        prompt = (
            "Summarize how these headlines frame the same story. "
            "Note differences in tone and emphasis in 2-3 sentences.\n\n"
            + "\n".join(f"- {h}" for h in headlines)
        )

        if settings.ai_provider == "gemini" and settings.gemini_api_key:
            return await self._gemini(prompt)
        if settings.groq_api_key:
            return await self._groq(prompt)

        return "AI summary unavailable (configure GROQ_API_KEY or GEMINI_API_KEY)."

    async def _groq(self, prompt: str) -> str:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {"Authorization": f"Bearer {settings.groq_api_key}", "Content-Type": "application/json"}
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.3,
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
        return data["choices"][0]["message"]["content"].strip()

    async def _gemini(self, prompt: str) -> str:
        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"gemini-2.0-flash:generateContent?key={settings.gemini_api_key}"
        )
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
        return data["candidates"][0]["content"]["parts"][0]["text"].strip()


ai_client = AIClient()
