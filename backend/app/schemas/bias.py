from pydantic import BaseModel, Field


class SourceBiasRead(BaseModel):
    source_id: int
    name: str
    bias_score: float | None = Field(None, ge=-1.0, le=1.0)


class BiasOverviewResponse(BaseModel):
    sources: list[SourceBiasRead]
