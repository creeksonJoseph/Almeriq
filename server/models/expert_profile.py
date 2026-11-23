from __future__ import annotations
import json
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column
from models.base import Base


class ExpertProfile(Base):
    __tablename__ = "expert_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    headline: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    expertise_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]", server_default="[]")
    years_experience: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    location: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    hourly_rate: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    availability: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    portfolio_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self) -> dict:
        try:
            expertise = json.loads(self.expertise_json or "[]")
        except (TypeError, ValueError):
            expertise = []
        return {
            "id": self.id, "user_id": self.user_id, "headline": self.headline,
            "bio": self.bio, "expertise": expertise, "years_experience": self.years_experience,
            "location": self.location, "hourly_rate": self.hourly_rate,
            "availability": self.availability, "portfolio_url": self.portfolio_url,
            "is_active": self.is_active, "created_at": self.created_at, "updated_at": self.updated_at,
        }
