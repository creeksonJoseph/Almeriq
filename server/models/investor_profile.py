from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import Text, Boolean, DateTime, Integer, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from models.base import Base


class InvestorProfile(Base):
    __tablename__ = "investor_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    firm_name: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    investment_focus: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    check_size: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    location: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    about: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    investor_type: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    preferred_sectors_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]", server_default="[]")
    preferred_stages_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]", server_default="[]")
    geographies_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]", server_default="[]")
    check_size_min: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    check_size_max: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    lead_follow_preference: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    track_record: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    value_add: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    accreditation_status: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    target_return_percent: Mapped[Optional[float]] = mapped_column(Numeric(7, 4), nullable=True)
    years_investing: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    verification_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notable_investments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    companies_backed: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    exits: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    assets_under_management: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    time_commitment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    contact_preference: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    contact_formats_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]", server_default="[]")
    preferred_payment_methods_json: Mapped[str] = mapped_column(Text, nullable=False, default='["visa"]', server_default='["visa"]')
    notify_deal_updates: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    notify_valuation_changes: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    notify_messages: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self) -> dict:
        def decode(value: str | None) -> list:
            try:
                result = json.loads(value) if value else []
                return result if isinstance(result, list) else []
            except (TypeError, ValueError):
                return []
        return {
            "id": self.id, "user_id": self.user_id, "firm_name": self.firm_name,
            "investment_focus": self.investment_focus, "check_size": self.check_size,
            "location": self.location, "about": self.about, "investor_type": self.investor_type,
            "preferred_sectors": decode(self.preferred_sectors_json),
            "preferred_stages": decode(self.preferred_stages_json),
            "geographies": decode(self.geographies_json),
            "check_size_min": self.check_size_min, "check_size_max": self.check_size_max,
            "lead_follow_preference": self.lead_follow_preference,
            "track_record": self.track_record, "value_add": self.value_add,
            "accreditation_status": self.accreditation_status, "target_return_percent": self.target_return_percent,
            "years_investing": self.years_investing, "verification_url": self.verification_url,
            "notable_investments": self.notable_investments, "companies_backed": self.companies_backed,
            "exits": self.exits, "assets_under_management": self.assets_under_management,
            "time_commitment": self.time_commitment, "contact_preference": self.contact_preference,
            "contact_formats": decode(self.contact_formats_json),
            "preferred_payment_methods": decode(self.preferred_payment_methods_json),
            "notify_deal_updates": self.notify_deal_updates,
            "notify_valuation_changes": self.notify_valuation_changes,
            "notify_messages": self.notify_messages, "verified": self.verified,
            "created_at": self.created_at, "updated_at": self.updated_at,
        }
