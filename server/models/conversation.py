"""models/conversation.py - SQLAlchemy 2.0 mapped model for conversations."""
from __future__ import annotations
from datetime import datetime, timezone
from sqlalchemy import Text, DateTime, Integer, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column
from models.base import Base


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    participant_a_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    participant_b_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
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
        UniqueConstraint("participant_a_id", "participant_b_id", name="uq_conversation_participants"),
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "participant_a_id": self.participant_a_id,
            "participant_b_id": self.participant_b_id,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }