/**
 * lib/api.js - barrel re-export.
 *
 * All domain logic now lives in focused modules:
 *   lib/api/auth.js         — signup, login, google, session, onboarding, password reset
 *   lib/api/waitlist.js     — waitlist POST / PUT
 *   lib/api/founder.js      — founder analysis
 *   lib/api/provider.js     — provider profile, assets, coverage
 *   lib/api/marketplace.js  — marketplace providers & listings
 *   lib/api/orders.js       — provider orders & fulfillment
 *   lib/api/deals.js        — deal creation, signing
 *   lib/api/conversations.js — chat conversations & messages
 *   lib/api/notifications.js — notification inbox
 *   lib/client.js           — shared axios instance, SWR cache, error parser
 *
 * Existing imports (`from "../lib/api"`) continue to work unchanged.
 */
export {
  apiClient,
  apiFetch,
  getCached,
  fetchWithSWR,
  invalidate,
} from "./client";

export {
  signupSendOtpApi,
  signupVerifyOtpApi,
  signupCompleteApi,
  registerApi,
  loginApi,
  googleAuthApi,
  getMeApi,
  logoutApi,
  onboardingApi,
  forgotPasswordApi,
  resetPasswordApi,
  sendChangeOtpApi,
  changePasswordApi,
} from "./api/auth";

export { postWaitlist, putWaitlist, requestOTP, verifyOTP } from "./api/waitlist";

export {
  saveBriefApi,
  analyzeFounderIdeaApi,
  listVenturesApi,
  getVentureApi,
  deleteVentureApi,
  getValidationApi,
  updateValidationApi,
  listLegalFilingsApi,
  createLegalFilingApi,
  getCompanyRegistrationGuideApi,
  executeAiToolApi,
} from "./api/founder";

export { getAdminWaitlistApi, updateAdminRoleApi } from "./api/admin";

export {
  getProviderProfileApi,
  updateProviderProfileApi,
  listAssetsApi,
  getAssetApi,
  createAssetApi,
  updateAssetApi,
  deleteAssetApi,
  listCoverageRegionsApi,
  updateCoverageRegionsApi,
} from "./api/provider";

export {
  listMarketplaceProvidersApi,
  getMarketplaceProviderApi,
  listMarketplaceListingsApi,
  getMarketplaceListingApi,
  searchMarketplaceApi,
} from "./api/marketplace";

export {
  listOrdersApi,
  getOrderApi,
  confirmOrderApi,
  declineOrderApi,
  shipOrderApi,
  updateOrderStatusApi,
  uploadWaybillApi,
  getWaybillApi,
} from "./api/orders";

export {
  createDealApi,
  getDealApi,
  signDealApi,
} from "./api/deals";

export {
  listConversationsApi,
  getConversationApi,
  sendMessageApi,
  markMessagesReadApi,
} from "./api/conversations";

export {
  listNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
} from "./api/notifications";