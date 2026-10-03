from pydantic import BaseModel, Field, model_validator


class VerifyRequest(BaseModel):
    text: str | None = Field(default=None, max_length=12_000)
    url: str | None = Field(default=None, max_length=2_048)

    @model_validator(mode="after")
    def require_text_or_url(self) -> "VerifyRequest":
        if not (self.text and self.text.strip()) and not (self.url and self.url.strip()):
            raise ValueError("Provide text or url.")
        return self


class VerifyResponse(BaseModel):
    accepted: bool
    guardrail_passed: bool
    truncated: bool
    verdict: str | None = None
    blocked_reasons: list[str] = Field(default_factory=list)
    cached: bool = False
    job_id: str | None = None
    slug: str | None = None
    analysis: str | None = None
