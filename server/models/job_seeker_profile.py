"""models/job_seeker_profile.py - SQLAlchemy 2.0 mapped model for job seeker profiles."""
from __future__ import annotations
import json
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column
from models.base import Base


class JobSeekerProfile(Base):
    __tablename__ = "job_seeker_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    headline: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    location: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    skills_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]", server_default="[]")
    experience_years: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    resume_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    portfolio_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    experience_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]", server_default="[]")
    education_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]", server_default="[]")
    certifications_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]", server_default="[]")
    projects_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]", server_default="[]")
    preferences_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}", server_default="{}")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc), nullable=False,
    )

    def to_dict(self) -> dict:
        def decode(value: str | None, fallback):
            try:
                return json.loads(value) if value else fallback
            except (TypeError, ValueError):
                return fallback

        return {
            "id": self.id,
            "user_id": self.user_id,
            "headline": self.headline,
            "bio": self.bio,
            "location": self.location,
            "skills": decode(self.skills_json, []),
            "experience_years": self.experience_years,
            "resume_url": self.resume_url,
            "portfolio_url": self.portfolio_url,
            "experience": decode(self.experience_json, []),
            "education": decode(self.education_json, []),
            "certifications": decode(self.certifications_json, []),
            "projects": decode(self.projects_json, []),
            "preferences": decode(self.preferences_json, {}),
            "is_active": self.is_active,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
