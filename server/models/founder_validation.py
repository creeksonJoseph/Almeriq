"""models/founder_validation.py - Per-user idea validation rubric state."""
from __future__ import annotations
from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column
from models.base import Base


class FounderValidation(Base):
    __tablename__ = "founder_validation"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, unique=True, index=True,
    )
    # 9 validation dimensions — each is independently set by the founder
    dim_problem: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    dim_solution: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    dim_market_size: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    dim_demand: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    dim_competition: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    dim_feasibility: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    dim_business_model: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    dim_legal: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    dim_risk: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    @property
    def score(self) -> int:
        dims = [
            self.dim_problem, self.dim_solution, self.dim_market_size,
            self.dim_demand, self.dim_competition, self.dim_feasibility,
            self.dim_business_model, self.dim_legal, self.dim_risk,
        ]
        return sum(1 for d in dims if d)

    def to_dict(self) -> dict:
        return {
            "dim_problem": self.dim_problem,
            "dim_solution": self.dim_solution,
            "dim_market_size": self.dim_market_size,
            "dim_demand": self.dim_demand,
            "dim_competition": self.dim_competition,
            "dim_feasibility": self.dim_feasibility,
            "dim_business_model": self.dim_business_model,
            "dim_legal": self.dim_legal,
            "dim_risk": self.dim_risk,
            "score": self.score,
            "updated_at": self.updated_at.isoformat(),
        }
