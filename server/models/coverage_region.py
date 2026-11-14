"""models/coverage_region.py - SQLAlchemy 2.0 mapped model for coverage regions."""
from __future__ import annotations
from datetime import datetime, timezone
from sqlalchemy import Text, DateTime, Integer, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column
from models.base import Base


class CoverageRegion(Base):
    __tablename__ = "coverage_regions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    provider_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("provider_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    region: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint("provider_id", "region", name="uq_coverage_provider_region"),
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "provider_id": self.provider_id,
            "region": self.region,
            "created_at": self.created_at,
        }