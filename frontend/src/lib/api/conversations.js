import { apiClient } from "../client";

export async function startProviderConversationApi(providerId) {
  const res = await apiClient.post(`/api/conversations/with-provider/${providerId}`);
  return res.data;
}

export async function listConversationsApi(params = {}) {
  const res = await apiClient.get("/api/conversations", { params });
  return res.data;
}

export async function listMessagesApi(id, params = {}) {
  const res = await apiClient.get(`/api/conversations/${id}/messages`, { params });
  return res.data;
}

export async function getConversationApi(id) {
  const res = await apiClient.get(`/api/conversations/${id}`);
  return res.data;
}

export async function sendMessageApi(conversationId, content) {
  const res = await apiClient.post(`/api/conversations/${conversationId}/messages`, { body: content });
  return res.data;
}

export async function markMessagesReadApi(conversationId) {
  const res = await apiClient.post(`/api/conversations/${conversationId}/read`);
  return res.data;
}

export async function startAdvisoryConversationApi(requestId) {
  const res = await apiClient.post(`/api/advisory-requests/${requestId}/conversation`);
  return res.data;
}


export async function startInvestmentConversationApi(investmentId) {
  const res = await apiClient.post(`/api/investment-requests/${investmentId}/conversation`);
  return res.data;
}
