from __future__ import annotations

from datetime import datetime, timezone
from sqlalchemy import DateTime, ForeignKey, Integer, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base


class TeamMembership(Base):
    __tablename__ = "team_memberships"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    founder_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    member_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    invitation_id: Mapped[int] = mapped_column(Integer, ForeignKey("team_invitations.id", ondelete="CASCADE"), nullable=False, unique=True)
    role: Mapped[str] = mapped_column(Text, nullable=False, default="member", server_default="member")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (UniqueConstraint("founder_id", "member_id", name="uq_team_membership_founder_member"),)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "founder_id": self.founder_id,
            "member_id": self.member_id,
            "invitation_id": self.invitation_id,
            "role": self.role,
            "created_at": self.created_at,
        }
