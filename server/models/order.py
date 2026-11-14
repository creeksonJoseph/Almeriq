"""models/order.py - SQLAlchemy 2.0 mapped model for orders."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import Text, DateTime, Integer, ForeignKey, Numeric, Index
from sqlalchemy.orm import Mapped, mapped_column
from models.base import Base


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    order_id: Mapped[str] = mapped_column(Text, unique=True, nullable=False, index=True)
    client_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    provider_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("provider_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    asset_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True
    )
    allocation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    lease_amount: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    status: Mapped[str] = mapped_column(Text, nullable=False, default="pending_review")
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

    __table_args__ = (
        Index("idx_orders_provider_status", "provider_id", "status"),
        Index("idx_orders_client_status", "client_id", "status"),
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "order_id": self.order_id,
            "client_id": self.client_id,
            "provider_id": self.provider_id,
            "asset_id": self.asset_id,
            "allocation": self.allocation,
            "lease_amount": float(self.lease_amount) if self.lease_amount is not None else None,
            "status": self.status,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }