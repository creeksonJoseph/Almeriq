import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import OnboardingWizard from "./OnboardingWizard";

export default function FounderRoute({ children }) {
  const { isLoggedIn, loading, user, updateUser } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] w-full">
        <div className="w-8 h-8 border-2 border-[#C9A15A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user && !user.onboarding_completed) {
    return <OnboardingWizard user={user} onComplete={(nextUser) => updateUser(nextUser)} />;
  }

  if (user?.role !== "founder") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
