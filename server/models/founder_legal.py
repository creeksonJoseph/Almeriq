"""models/founder_legal.py - Legal registrations (company & IP) filed by founders."""
from __future__ import annotations
import secrets
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column
from models.base import Base


def _gen_ref(prefix: str) -> str:
    return f"ALQ-{prefix}-{secrets.randbelow(900000) + 100000}"


class FounderLegalFiling(Base):
    __tablename__ = "founder_legal_filings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    filing_type: Mapped[str] = mapped_column(Text, nullable=False)  # "company" | "ip"
    ref_number: Mapped[str] = mapped_column(Text, nullable=False, unique=True, index=True)
    status: Mapped[str] = mapped_column(Text, nullable=False, default="Filed")

    # Company fields (used when filing_type == "company")
    company_name: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    entity_type: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    jurisdiction: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # IP fields (used when filing_type == "ip")
    ip_title: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ip_type: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ip_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    filed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    @classmethod
    def make_ref(cls, filing_type: str) -> str:
        return _gen_ref("CO" if filing_type == "company" else "IP")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "filing_type": self.filing_type,
            "ref_number": self.ref_number,
            "status": self.status,
            "company_name": self.company_name,
            "entity_type": self.entity_type,
            "jurisdiction": self.jurisdiction,
            "ip_title": self.ip_title,
            "ip_type": self.ip_type,
            "ip_description": self.ip_description,
            "filed_at": self.filed_at.isoformat(),
        }
