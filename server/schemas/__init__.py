"""schemas/__init__.py - Re-export all schemas for easy imports."""
from __future__ import annotations
from .auth import *
from .provider import *
from .waitlist import *
from .founder import *

__all__ = [
    # auth
    "UserRegisterRequest", "UserLoginRequest", "GoogleAuthRequest", "UserOnboardingRequest",
    "UserResponse", "AuthMessageResponse", "SignupSendOtpRequest", "SignupVerifyOtpRequest",
    "SignupCompleteRequest", "ForgotPasswordRequest", "ResetPasswordRequest", "ChangePasswordRequest",
    # provider
    "ProviderProfileCreateRequest", "ProviderProfileUpdateRequest", "ProviderProfileResponse",
    "AssetCreateRequest", "AssetUpdateRequest", "AssetResponse", "AssetListResponse",
    "CoverageRegionCreateRequest", "CoverageRegionResponse", "CoverageRegionListResponse",
    "MarketplaceListingResponse", "MarketplaceListingDetailResponse", "MarketplaceListingListResponse",
    "SearchResultResponse",
    "OrderCreateRequest", "OrderStatusUpdateRequest", "WaybillUploadRequest",
    "OrderResponse", "OrderDetailResponse", "OrderListResponse",
    "OrderEventResponse",
    "DealCreateRequest", "DealSignRequest", "DealResponse",
    "ConversationResponse", "ConversationListResponse", "UserSummary",
    "MessageCreateRequest", "MessageResponse", "MessageListResponse",
    "NotificationResponse", "NotificationListResponse",
    # waitlist
    "WaitlistRequest", "WaitlistResponse",
    # founder
    "FounderValidationRequest", "FounderValidationResponse",
    "FounderLegalFilingRequest", "FounderLegalFilingResponse",
    "FounderVentureRequest", "FounderVentureResponse",
    "FounderAiCacheRequest", "FounderAiCacheResponse",
]