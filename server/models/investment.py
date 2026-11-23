from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Optional
from sqlalchemy import Text, Date, DateTime, Integer, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from models.base import Base


class Investment(Base):
    __tablename__ = "investments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    investor_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    pitch_id: Mapped[int] = mapped_column(Integer, ForeignKey("startup_pitches.id", ondelete="CASCADE"), nullable=False, index=True)
    amount: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    status: Mapped[str] = mapped_column(Text, nullable=False, default="pending", server_default="pending")
    investment_amount: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    current_value: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    ownership_percent: Mapped[Optional[float]] = mapped_column(Numeric(7, 4), nullable=True)
    investment_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    risk_level: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    payment_method: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    signature_data: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    deal_confirmed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self) -> dict:
        return {
            "id": self.id, "investor_id": self.investor_id, "pitch_id": self.pitch_id,
            "amount": self.amount, "status": self.status,
            "investment_amount": self.investment_amount, "current_value": self.current_value,
            "ownership_percent": self.ownership_percent, "investment_date": self.investment_date,
            "notes": self.notes, "risk_level": self.risk_level, "payment_method": self.payment_method,
            "signature_data": self.signature_data, "deal_confirmed_at": self.deal_confirmed_at,
            "created_at": self.created_at, "updated_at": self.updated_at,
        }
