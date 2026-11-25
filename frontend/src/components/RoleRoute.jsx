import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { normalizeRole } from "../lib/roles";

/** Role-level guard; authentication and onboarding stay in ProtectedRoute. */
export default function RoleRoute({ allowedRoles, children }) {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);
  const allowed = (allowedRoles || []).map((item) => normalizeRole(item));
  if (!allowed.includes(role)) return <Navigate to="/dashboard" replace />;
  return children;
}
