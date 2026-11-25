"""models/provider_verification_event.py - Immutable provider verification review history."""
from __future__ import annotations

from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base


class ProviderVerificationEvent(Base):
    __tablename__ = "provider_verification_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    provider_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("provider_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    reviewer_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    verified: Mapped[bool] = mapped_column(Boolean, nullable=False)
    reviewed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    def to_dict(self, reviewer_name: str | None = None, reviewer_email: str | None = None) -> dict:
        return {
            "id": self.id,
            "provider_id": self.provider_id,
            "reviewer_id": self.reviewer_id,
            "reviewer_name": reviewer_name,
            "reviewer_email": reviewer_email,
            "verified": self.verified,
            "reviewed_at": self.reviewed_at,
        }
