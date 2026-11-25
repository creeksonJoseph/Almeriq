import React, { Suspense, lazy } from "react";
import { useAuth } from "../../context/AuthContext";
import { normalizeRole } from "../../lib/roles";
import { RouteSkeleton } from "../../components/ui";

const ProviderDashboardPage = lazy(() => import("../provider/ProviderDashboardPage"));
const JobSeekerDashboardPage = lazy(() => import("../jobseeker/JobSeekerDashboardPage"));
const InvestorDashboardPage = lazy(() => import("../investor/InvestorDashboardPage"));
const ExpertDashboardPage = lazy(() => import("../expert/ExpertDashboardPage"));
const DashboardComponent = lazy(() => import("../../components/Dashboard"));
const AdminWaitlistPage = lazy(() => import("../admin/AdminWaitlistPage"));

const PageLoader = () => <RouteSkeleton variant="dashboard" />;

export default function DashboardPage() {
  const { user, logout, updateUser } = useAuth();
  const role = normalizeRole(user?.role);

  if (role === "infrastructure_provider") {
    return (
      <Suspense fallback={<PageLoader />}>
        <ProviderDashboardPage />
      </Suspense>
    );
  }

  if (role === "job_seeker") {
    return (
      <Suspense fallback={<PageLoader />}>
        <JobSeekerDashboardPage />
      </Suspense>
    );
  }

  if (role === "investor") {
    return (
      <Suspense fallback={<PageLoader />}>
        <InvestorDashboardPage />
      </Suspense>
    );
  }

  if (role === "expert") {
    return (
      <Suspense fallback={<PageLoader />}>
        <ExpertDashboardPage />
      </Suspense>
    );
  }

  if (role === "admin" || Boolean(user?.is_admin)) {
    return (
      <Suspense fallback={<PageLoader />}>
        <AdminWaitlistPage />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <DashboardComponent
        user={user}
        onLogout={logout}
        onRestartOnboarding={() => updateUser({ onboarding_completed: false })}
      />
    </Suspense>
  );
}