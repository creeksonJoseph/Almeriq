import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/** Role-level guard; authentication and onboarding stay in ProtectedRoute. */
export default function RoleRoute({ allowedRoles, children }) {
  const { user } = useAuth();
  const role = String(user?.role || "").toLowerCase();
  const allowed = (allowedRoles || []).map((item) => String(item).toLowerCase());
  if (!allowed.includes(role)) return <Navigate to="/dashboard" replace />;
  return children;
}
