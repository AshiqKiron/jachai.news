from pydantic import BaseModel, Field


class SourceRead(BaseModel):
    source_id: int
    name: str

    model_config = {"from_attributes": True}


class SourceListResponse(BaseModel):
    items: list[SourceRead] = Field(default_factory=list)
