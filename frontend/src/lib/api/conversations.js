import { apiClient } from "../client";

export async function listConversationsApi(params = {}) {
  const res = await apiClient.get("/conversations", { params });
  return res.data;
}

export async function getConversationApi(id) {
  const res = await apiClient.get(`/conversations/${id}`);
  return res.data;
}

export async function sendMessageApi(conversationId, content) {
  const res = await apiClient.post(`/conversations/${conversationId}/messages`, { content });
  return res.data;
}

export async function markMessagesReadApi(conversationId) {
  const res = await apiClient.post(`/conversations/${conversationId}/read`);
  return res.data;
}