"""models/deal.py - SQLAlchemy 2.0 mapped model for deals."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import Text, DateTime, Integer, ForeignKey, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from models.base import Base


class Deal(Base):
    __tablename__ = "deals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    order_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("orders.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    payment_method: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    amount: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    signature: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    signed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "order_id": self.order_id,
            "payment_method": self.payment_method,
            "amount": float(self.amount) if self.amount is not None else None,
            "signature": self.signature,
            "signed_at": self.signed_at,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }