"""models/founder_ai_cache.py - Cached results from individual AI tool calls."""
from __future__ import annotations
from datetime import datetime, timezone
from sqlalchemy import DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column
from models.base import Base


class FounderAiCache(Base):
    """
    One row per (user_id, tool_key, content_hash).
    content_hash is SHA256 of the brief fields so the cache invalidates
    automatically when the brief changes.
    """
    __tablename__ = "founder_ai_cache"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    tool_key: Mapped[str] = mapped_column(Text, nullable=False)
    content_hash: Mapped[str] = mapped_column(Text, nullable=False)
    result_json: Mapped[str] = mapped_column(Text, nullable=False)  # JSON string
    source: Mapped[str] = mapped_column(Text, nullable=False, default="local")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def to_dict(self) -> dict:
        import json
        return {
            "tool_key": self.tool_key,
            "result": json.loads(self.result_json),
            "source": self.source,
            "created_at": self.created_at.isoformat(),
        }
