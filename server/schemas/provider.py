"""schemas/provider.py - Pydantic models for provider domain."""
from __future__ import annotations
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, field_validator
from decimal import Decimal


# Provider Profile schemas
class ProviderProfileBase(BaseModel):
    company_name: Optional[str] = Field(default=None, max_length=200)
    trading_name: Optional[str] = Field(default=None, max_length=200)
    provider_type: Optional[str] = Field(default=None, max_length=50)
    location: Optional[str] = Field(default=None, max_length=200)
    about: Optional[str] = Field(default=None)
    engagement_preferences: Optional[str] = Field(default=None)
    enclave_key: Optional[str] = Field(default=None, max_length=100)


class ProviderProfileCreateRequest(ProviderProfileBase):
    pass


class ProviderProfileUpdateRequest(ProviderProfileBase):
    pass


class ProviderProfileResponse(ProviderProfileBase):
    id: int
    user_id: int
    verified: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Asset schemas
class AssetBase(BaseModel):
    name: str = Field(..., max_length=200)
    category: str = Field(..., max_length=100)
    kind: str = Field(..., max_length=20)
    client_asset_id: Optional[str] = Field(default=None, max_length=64)
    description: Optional[str] = None
    specs: Optional[dict] = None
    price_monthly: Optional[Decimal] = Field(default=None, ge=0)
    quantity_capacity: Optional[int] = Field(default=None, ge=0)
    telemetry_url: Optional[str] = None


class AssetCreateRequest(AssetBase):
    @field_validator("kind", mode="before")
    @classmethod
    def validate_kind(cls, v: str) -> str:
        if v not in ("physical", "digital"):
            raise ValueError("kind must be 'physical' or 'digital'")
        return v


class AssetUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, max_length=200)
    category: Optional[str] = Field(default=None, max_length=100)
    kind: Optional[str] = Field(default=None, max_length=20)
    description: Optional[str] = None
    specs: Optional[dict] = None
    price_monthly: Optional[Decimal] = Field(default=None, ge=0)
    quantity_capacity: Optional[int] = Field(default=None, ge=0)
    status: Optional[str] = Field(default=None, max_length=20)
    telemetry_url: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("kind", mode="before")
    @classmethod
    def validate_kind(cls, v: str | None) -> str | None:
        if v is not None and v not in ("physical", "digital"):
            raise ValueError("kind must be 'physical' or 'digital'")
        return v

    @field_validator("status", mode="before")
    @classmethod
    def validate_status(cls, v: str | None) -> str | None:
        if v is not None and v not in ("available", "reserved", "unavailable"):
            raise ValueError("status must be 'available', 'reserved', or 'unavailable'")
        return v


class AssetResponse(AssetBase):
    media: List[dict] = Field(default_factory=list)
    id: int
    provider_id: int
    status: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AssetListResponse(BaseModel):
    items: List[AssetResponse]
    total: int


# Coverage Region schemas
class CoverageRegionCreateRequest(BaseModel):
    region: str = Field(..., max_length=50)

    @field_validator("region", mode="before")
    @classmethod
    def validate_region(cls, v: str) -> str:
        valid_regions = {
            "africa", "asia_pacific", "europe", "latin_america",
            "middle_east", "north_america", "global"
        }
        if v not in valid_regions:
            raise ValueError(f"region must be one of: {', '.join(sorted(valid_regions))}")
        return v


class CoverageRegionResponse(BaseModel):
    id: int
    provider_id: int
    region: str
    created_at: datetime

    class Config:
        from_attributes = True


class CoverageRegionListResponse(BaseModel):
    items: List[CoverageRegionResponse]


# Marketplace schemas (public)
class MarketplaceListingResponse(BaseModel):
    id: int
    name: str
    category: str
    kind: str
    description: Optional[str]
    specs: Optional[dict]
    price_monthly: Optional[float]
    status: str
    provider_id: int
    provider_name: str
    provider_verified: bool
    provider_location: Optional[str]
    provider_enclave_key: Optional[str]
    media: List[dict] = Field(default_factory=list)
    created_at: datetime

    class Config:
        from_attributes = True


class MarketplaceListingDetailResponse(MarketplaceListingResponse):
    assets: List[AssetResponse]  # All assets from this provider


class MarketplaceListingListResponse(BaseModel):
    items: List[MarketplaceListingResponse]
    total: int


# Search schemas
class SearchResultItem(BaseModel):
    id: int
    name: str
    category: str
    kind: str
    description: Optional[str]
    price_monthly: Optional[float]
    status: str
    provider_id: int
    provider_name: str
    provider_verified: bool
    provider_location: Optional[str]

    class Config:
        from_attributes = True


class SearchResultResponse(BaseModel):
    items: List[SearchResultItem]
    total: int


# Order schemas
class OrderBase(BaseModel):
    allocation: Optional[str] = None
    lease_amount: Optional[Decimal] = Field(default=None, ge=0)
    status: str = "pending_review"


class OrderCreateRequest(BaseModel):
    asset_id: int
    allocation: Optional[str] = None
    lease_amount: Optional[Decimal] = Field(default=None, ge=0)


class OrderStatusUpdateRequest(BaseModel):
    status: str = Field(..., max_length=30)

    @field_validator("status", mode="before")
    @classmethod
    def validate_status(cls, v: str) -> str:
        valid_statuses = {
            "pending_review", "confirmed", "shipped", "completed", "declined"
        }
        if v not in valid_statuses:
            raise ValueError(f"status must be one of: {', '.join(sorted(valid_statuses))}")
        return v


class WaybillUploadRequest(BaseModel):
    waybill_url: str = Field(..., max_length=500)
    tracking_number: Optional[str] = Field(default=None, max_length=100)


class WaybillResponse(BaseModel):
    order_id: int
    waybill_url: Optional[str] = None
    tracking_number: Optional[str] = None
    uploaded_at: Optional[datetime] = None


class OrderResponse(OrderBase):
    id: int
    order_id: str
    client_id: int
    provider_id: int
    asset_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OrderDetailResponse(OrderResponse):
    client_name: Optional[str] = None
    client_email: Optional[str] = None
    asset_name: Optional[str] = None
    asset_category: Optional[str] = None
    events: List["OrderEventResponse"] = []

    class Config:
        from_attributes = True


class OrderListResponse(BaseModel):
    items: List[OrderResponse]
    total: int


# Order Event schemas
class OrderEventResponse(BaseModel):
    id: int
    order_id: int
    event_type: str
    actor_id: int
    note: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# Deal schemas
class DealCreateRequest(BaseModel):
    order_id: int
    payment_method: str = Field(..., max_length=50)
    amount: Decimal = Field(..., ge=0)


class DealSignRequest(BaseModel):
    signature: str = Field(..., min_length=1)
    payment_method: Optional[str] = Field(default=None, max_length=50)
    amount: Optional[Decimal] = Field(default=None, ge=0)


class DealResponse(BaseModel):
    id: int
    order_id: int
    payment_method: Optional[str]
    payment_status: str = "simulated"
    amount: Optional[float]
    signature: Optional[str]
    signed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Conversation schemas
class ConversationResponse(BaseModel):
    id: int
    participant_a_id: int
    participant_b_id: int
    created_at: datetime
    updated_at: datetime
    other_participant: Optional["UserSummary"] = None
    last_message: Optional["MessageResponse"] = None
    unread_count: int = 0

    class Config:
        from_attributes = True


class ConversationListResponse(BaseModel):
    items: List[ConversationResponse]


class UserSummary(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    role: str
    is_admin: bool = False


# Message schemas
class MessageCreateRequest(BaseModel):
    body: str = Field(..., min_length=1)


class CoverageRegionUpdateRequest(BaseModel):
    regions: List[str]


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    body: str
    read_at: Optional[datetime]
    created_at: datetime
    sender: Optional[UserSummary] = None

    class Config:
        from_attributes = True


class MessageListResponse(BaseModel):
    items: List[MessageResponse]


# Notification schemas
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    type: str
    title: str
    body: str
    read: bool
    link: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    items: List[NotificationResponse]
    unread_count: int