"""models/order_event.py - SQLAlchemy 2.0 mapped model for order events."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import Text, DateTime, Integer, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column
from models.base import Base


class OrderEvent(Base):
    __tablename__ = "order_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    order_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True
    )
    event_type: Mapped[str] = mapped_column(Text, nullable=False)
    actor_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        Index("idx_order_events_order_created", "order_id", "created_at"),
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "order_id": self.order_id,
            "event_type": self.event_type,
            "actor_id": self.actor_id,
            "note": self.note,
            "created_at": self.created_at,
        }