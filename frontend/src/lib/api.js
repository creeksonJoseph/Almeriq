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
  listFounderInvestorUpdatesApi,
  createInvestorUpdateApi,
  updateInvestorUpdateApi,
  publishInvestorUpdateApi,
} from "./api/founder";

export { getAdminWaitlistApi, updateAdminRoleApi, getAdminProvidersApi, updateAdminProviderVerificationApi } from "./api/admin";

export {
  getProviderProfileApi,
  updateProviderProfileApi,
  listAssetsApi,
  getAssetApi,
  createAssetApi,
  updateAssetApi,
  deleteAssetApi,
  uploadAssetMediaApi,
  deleteAssetMediaApi,
  listCoverageRegionsApi,
  updateCoverageRegionsApi,
} from "./api/provider";

export {
  listMarketplaceProvidersApi,
  getMarketplaceProviderApi,
  listMarketplaceListingsApi,
  getMarketplaceListingApi,
  createMarketplaceCheckoutApi,
  searchMarketplaceApi,
} from "./api/marketplace";

export {
  listOrdersApi,
  getProviderOrderSummaryApi,
  getOrderApi,
  confirmOrderApi,
  declineOrderApi,
  shipOrderApi,
  dispatchOrderApi,
  updateOrderStatusApi,
  uploadWaybillApi,
  getWaybillApi,
  listClientOrdersApi,
  getClientOrderApi,
} from "./api/orders";

export {
  createDealApi,
  getDealApi,
  signDealApi,
} from "./api/deals";

export {
  listConversationsApi,
  getConversationSummaryApi,
  startProviderConversationApi,
  getConversationApi,
  listMessagesApi,
  sendMessageApi,
  markMessagesReadApi,
  startAdvisoryConversationApi,
  startInvestmentConversationApi,
} from "./api/conversations";

export {
  listNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
} from "./api/notifications";

export {
  getJobSeekerProfileApi,
  saveJobSeekerProfileApi,
  listJobsApi,
  getJobApi,
  listMyJobsApi,
  createJobApi,
  updateJobApi,
  deleteJobApi,
  applyToJobApi,
  listMyJobApplicationsApi,
  getMyJobApplicationApi,
  withdrawJobApplicationApi,
  listJobApplicationsApi,
  reviewJobApplicationApi,
} from "./api/job";

export {
  getInvestorProfileApi,
  updateInvestorProfileApi,
  listInvestorStartupsApi,
  getInvestorStartupApi,
  createInvestmentApi,
  listInvestorPortfolioApi,
  getInvestorPortfolioItemApi,
  updateInvestorPortfolioApi,
  listInvestorUpdatesApi,
} from "./api/investor";
export {
  discoverTalentApi,
  getTalentProfileApi,
  inviteTalentApi,
  listFounderTeamInvitationsApi,
  listTeamMembersApi,
  removeTeamMemberApi,
  listMyTeamInvitationsApi,
  respondToTeamInvitationApi,
} from "./api/team";
