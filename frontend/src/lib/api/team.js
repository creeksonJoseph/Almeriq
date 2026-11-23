import { apiClient } from "../client";

export async function discoverTalentApi(params = {}) {
  const { data } = await apiClient.get("/api/founder/talent", { params });
  return data;
}
export async function getTalentProfileApi(userId) {
  const { data } = await apiClient.get(`/api/founder/talent/${encodeURIComponent(userId)}`);
  return data;
}
export async function inviteTalentApi(payload) {
  const { data } = await apiClient.post("/api/founder/team/invitations", payload);
  return data;
}
export async function listFounderTeamInvitationsApi() {
  const { data } = await apiClient.get("/api/founder/team/invitations");
  return data;
}
export async function listTeamMembersApi() {
  const { data } = await apiClient.get("/api/founder/team/members");
  return data;
}
export async function removeTeamMemberApi(memberId) {
  await apiClient.delete(`/api/founder/team/members/${encodeURIComponent(memberId)}`);
}
export async function listMyTeamInvitationsApi() {
  const { data } = await apiClient.get("/api/job-seeker/team-invitations");
  return data;
}
export async function respondToTeamInvitationApi(invitationId, status) {
  const { data } = await apiClient.patch(`/api/job-seeker/team-invitations/${encodeURIComponent(invitationId)}`, { status });
  return data;
}
