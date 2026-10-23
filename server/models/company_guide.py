"""models/company_guide.py - Cached company registration guides by country."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base


class CompanyRegistrationGuide(Base):
    """
    Stores country-specific step-by-step company registration guides.
    Once generated via AI for any country, it is persisted to the database
    so subsequent requests by any founder are served instantly from the DB.
    """
    __tablename__ = "company_registration_guides"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    country: Mapped[str] = mapped_column(Text, nullable=False, unique=True, index=True)
    country_name: Mapped[str] = mapped_column(Text, nullable=False)
    regulatory_body: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    portal_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    estimated_timeline: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    estimated_cost: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    prerequisites_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    steps_json: Mapped[str] = mapped_column(Text, nullable=False)
    common_pitfalls_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    post_registration_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    source: Mapped[str] = mapped_column(Text, nullable=False, default="ai")

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

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "country": self.country,
            "country_name": self.country_name,
            "regulatory_body": self.regulatory_body,
            "portal_url": self.portal_url,
            "estimated_timeline": self.estimated_timeline,
            "estimated_cost": self.estimated_cost,
            "prerequisites": json.loads(self.prerequisites_json) if self.prerequisites_json else [],
            "steps": json.loads(self.steps_json) if self.steps_json else [],
            "common_pitfalls": json.loads(self.common_pitfalls_json) if self.common_pitfalls_json else [],
            "post_registration": json.loads(self.post_registration_json) if self.post_registration_json else [],
            "source": self.source,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
