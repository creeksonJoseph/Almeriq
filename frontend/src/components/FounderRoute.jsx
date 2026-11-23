import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import OnboardingWizard from "./OnboardingWizard";
import { RouteSkeleton } from "./ui";

export default function FounderRoute({ children }) {
  const { isLoggedIn, loading, user, updateUser } = useAuth();
  const location = useLocation();

  if (loading) return <RouteSkeleton variant="dashboard" />;

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user && !user.onboarding_completed) {
    return <OnboardingWizard user={user} onComplete={(nextUser) => updateUser(nextUser)} />;
  }

  if (String(user?.role || "").toLowerCase() !== "founder") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
