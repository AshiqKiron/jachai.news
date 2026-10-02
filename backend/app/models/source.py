from sqlalchemy import Float, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Source(Base):
    __tablename__ = "sources"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    feed_url: Mapped[str] = mapped_column(String(2048))
    bias_score: Mapped[float | None] = mapped_column(Float, nullable=True)  # -1 left .. +1 right

    articles: Mapped[list["Article"]] = relationship(back_populates="source")
