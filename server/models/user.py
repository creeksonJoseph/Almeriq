"""models/user.py - SQLAlchemy 2.0 mapped model for users."""
from __future__ import annotations
from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
from models.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(Text, unique=True, nullable=False, index=True)
    hashed_password: Mapped[str | None] = mapped_column(Text, nullable=True)
    full_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    nationality: Mapped[str | None] = mapped_column(Text, nullable=True)
    id_number: Mapped[str | None] = mapped_column(Text, nullable=True)
    role: Mapped[str] = mapped_column(Text, nullable=False, default="user")
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    google_id: Mapped[str | None] = mapped_column(Text, unique=True, nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "email": self.email,
            "hashed_password": self.hashed_password,
            "full_name": self.full_name,
            "nationality": self.nationality,
            "id_number": self.id_number,
            "role": self.role,
            "onboarding_completed": self.onboarding_completed,
            "google_id": self.google_id,
            "created_at": self.created_at,
        }
