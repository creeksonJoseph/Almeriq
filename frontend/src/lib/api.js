/**
 * lib/api.js - barrel re-export.
 *
 * All domain logic now lives in focused modules:
 *   lib/api/auth.js     — signup, login, google, session, onboarding, password reset
 *   lib/api/waitlist.js — waitlist POST / PUT
 *   lib/api/founder.js  — founder analysis
 *   lib/client.js       — shared axios instance, SWR cache, error parser
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
} from "./api/auth";

export { postWaitlist, putWaitlist, requestOTP, verifyOTP } from "./api/waitlist";

export {
  analyzeFounderIdeaApi,
  listVenturesApi,
  getVentureApi,
  deleteVentureApi,
  getValidationApi,
  updateValidationApi,
  listLegalFilingsApi,
  createLegalFilingApi,
  executeAiToolApi,
} from "./api/founder";

