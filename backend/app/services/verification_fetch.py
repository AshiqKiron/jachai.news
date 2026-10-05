import httpx

from app.services.ai_input_sanitizer import InputValidationError, validate_http_url

_MAX_FETCH_BYTES = 64_000


async def fetch_claim_source_text(url: str) -> str:
    safe_url = validate_http_url(url)
    async with httpx.AsyncClient(
        timeout=12.0,
        follow_redirects=True,
        headers={"User-Agent": "ShorupNewsVerify/1.0"},
    ) as client:
        response = await client.get(safe_url)
        response.raise_for_status()
        if len(response.content) > _MAX_FETCH_BYTES:
            raise InputValidationError("URL response is too large.")
        return response.text
