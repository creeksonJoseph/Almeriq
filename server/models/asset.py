"""models/asset.py - SQLAlchemy 2.0 mapped model for assets."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import Text, Boolean, DateTime, Integer, ForeignKey, Numeric, JSON, Index
from sqlalchemy.orm import Mapped, mapped_column
from models.base import Base


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    provider_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("provider_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    client_asset_id: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(Text, nullable=False)
    kind: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    specs: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    media: Mapped[Optional[list]] = mapped_column(JSON, nullable=True, default=list)
    price_monthly: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    quantity_capacity: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(Text, nullable=False, default="available")
    telemetry_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
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
        Index("idx_assets_provider_kind", "provider_id", "kind"),
        Index("idx_assets_provider_status", "provider_id", "status"),
        Index("uq_assets_provider_client_asset", "provider_id", "client_asset_id", unique=True),
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "client_asset_id": self.client_asset_id,
            "provider_id": self.provider_id,
            "name": self.name,
            "category": self.category,
            "kind": self.kind,
            "description": self.description,
            "specs": self.specs,
            "media": self.media or [],
            "price_monthly": float(self.price_monthly) if self.price_monthly is not None else None,
            "quantity_capacity": self.quantity_capacity,
            "status": self.status,
            "telemetry_url": self.telemetry_url,
            "is_active": self.is_active,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }