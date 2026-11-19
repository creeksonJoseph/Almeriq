from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import Text, DateTime, Integer, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from models.base import Base


class Investment(Base):
    __tablename__ = "investments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    investor_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    pitch_id: Mapped[int] = mapped_column(Integer, ForeignKey("startup_pitches.id", ondelete="CASCADE"), nullable=False, index=True)
    amount: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    status: Mapped[str] = mapped_column(Text, nullable=False, default="pending", server_default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self) -> dict:
        return {"id": self.id, "investor_id": self.investor_id, "pitch_id": self.pitch_id, "amount": self.amount, "status": self.status, "created_at": self.created_at, "updated_at": self.updated_at}
