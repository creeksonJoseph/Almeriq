/**
 * Shared role normalization helpers matching backend core/roles.py.
 *
 * Canonical backend roles are lowercase snake_case:
 * founder, investor, infrastructure_provider, job_seeker, expert, admin, user.
 */

export function normalizeRole(role) {
  if (typeof role !== "string") return "";
  const normalized = role.trim().toLowerCase().replaceAll("-", " ");
  return normalized.split(/\s+/).filter(Boolean).join("_");
}

export function userHasRole(user, expectedRole) {
  return Boolean(normalizeRole(expectedRole)) && normalizeRole(user?.role) === normalizeRole(expectedRole);
}

export function formatRoleLabel(role) {
  const normalized = normalizeRole(role);
  if (!normalized) return "User";
  return normalized
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
