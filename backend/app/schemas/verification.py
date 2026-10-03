from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

VerificationStatus = Literal["pending", "processing", "completed", "failed", "cached"]
VerificationVerdict = Literal[
    "pending",
    "true",
    "false",
    "misleading",
    "unverified",
    "insufficient_evidence",
]


class VerificationCreate(BaseModel):
    claim: str = Field(..., min_length=8, max_length=4000)


class VerifiedClaimRead(BaseModel):
    id: int
    slug: str
    claim_text: str
    verdict: str
    analysis: str | None
    tags: str | None
    status: str
    cache_source_id: int | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class VerificationJobRead(BaseModel):
    job_id: str
    status: VerificationStatus
    progress: int = Field(ge=0, le=100)
    slug: str | None = None
    message: str | None = None
    cached: bool = False


class VerificationCreateResponse(BaseModel):
    job_id: str | None = None
    cached: bool = False
    verification: VerifiedClaimRead | None = None


class VerifiedClaimListResponse(BaseModel):
    items: list[VerifiedClaimRead]
    total: int


class VerificationSearchResponse(BaseModel):
    items: list[VerifiedClaimRead]
    total: int
    query: str
