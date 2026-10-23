"""models/founder_venture.py - SQLAlchemy 2.0 model for saved founder venture analyses."""
from __future__ import annotations
from datetime import datetime, timezone
from sqlalchemy import DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column
from models.base import Base


class FounderVenture(Base):
    __tablename__ = "founder_ventures"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Brief inputs (stored for display)
    name: Mapped[str | None] = mapped_column(Text, nullable=True)
    idea: Mapped[str] = mapped_column(Text, nullable=False)
    problem: Mapped[str] = mapped_column(Text, nullable=False)
    solution: Mapped[str] = mapped_column(Text, nullable=False)
    customer: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[str] = mapped_column(Text, nullable=False)

    # Analysis outputs (stored as JSON text)
    source: Mapped[str] = mapped_column(Text, nullable=False, default="local")
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    market: Mapped[str] = mapped_column(Text, nullable=False)
    risks_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    mvp_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    roadmap_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    next_steps_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def to_dict(self) -> dict:
        import json
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name or "",
            "idea": self.idea,
            "problem": self.problem,
            "solution": self.solution,
            "customer": self.customer,
            "location": self.location,
            "source": self.source,
            "summary": self.summary,
            "market": self.market,
            "risks": json.loads(self.risks_json),
            "mvp": json.loads(self.mvp_json),
            "roadmap": json.loads(self.roadmap_json),
            "next_steps": json.loads(self.next_steps_json),
            "created_at": self.created_at.isoformat(),
        }
