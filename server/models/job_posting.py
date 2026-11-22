"""models/job_posting.py - SQLAlchemy 2.0 mapped model for job postings."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Integer, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column
from models.base import Base


class JobPosting(Base):
    __tablename__ = "job_postings"
    __table_args__ = (
        CheckConstraint(
            "(provider_id IS NOT NULL AND founder_user_id IS NULL) OR "
            "(provider_id IS NULL AND founder_user_id IS NOT NULL)",
            name="ck_job_posting_exactly_one_owner",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    provider_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("provider_profiles.id", ondelete="CASCADE"), nullable=True, index=True
    )
    founder_user_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    role_type: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    salary_min: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    salary_max: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    requirements: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc), nullable=False
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "provider_id": self.provider_id,
            "founder_user_id": self.founder_user_id,
            "title": self.title,
            "description": self.description,
            "location": self.location,
            "role_type": self.role_type,
            "salary_min": float(self.salary_min) if self.salary_min is not None else None,
            "salary_max": float(self.salary_max) if self.salary_max is not None else None,
            "requirements": self.requirements,
            "is_active": self.is_active,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
