"""models/waitlist.py - SQLAlchemy 2.0 mapped model for waitlist."""
from __future__ import annotations
from datetime import datetime, timezone
from sqlalchemy import DateTime, Index, Text
from sqlalchemy.orm import Mapped, mapped_column
from models.base import Base


class Waitlist(Base):
    __tablename__ = "waitlist"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    full_name: Mapped[str] = mapped_column(Text, nullable=False)
    email: Mapped[str] = mapped_column(Text, unique=True, nullable=False, index=True)
    role: Mapped[str] = mapped_column(Text, nullable=False)
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    otp_code: Mapped[str | None] = mapped_column(Text, nullable=True)
    otp_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("idx_waitlist_joined_at", joined_at.desc()),
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "full_name": self.full_name,
            "email": self.email,
            "role": self.role,
            "joined_at": self.joined_at,
        }
