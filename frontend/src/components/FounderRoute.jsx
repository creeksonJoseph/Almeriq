import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { userHasRole } from "../lib/roles";
import OnboardingWizard from "./OnboardingWizard";
import { RouteSkeleton } from "./ui";

export default function FounderRoute({ children }) {
  const { isLoggedIn, loading, user, updateUser } = useAuth();
  const location = useLocation();

  if (loading) return <RouteSkeleton />;

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user && !user.onboarding_completed) {
    return <OnboardingWizard user={user} onComplete={(nextUser) => updateUser(nextUser)} />;
  }

  if (!userHasRole(user, "founder")) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
