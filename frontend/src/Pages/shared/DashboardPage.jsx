import React, { Suspense, lazy } from "react";
import { useAuth } from "../../context/AuthContext";

const ProviderDashboardPage = lazy(() => import("../provider/ProviderDashboardPage"));
const DashboardComponent = lazy(() => import("../../components/Dashboard"));
const AdminWaitlistPage = lazy(() => import("../admin/AdminWaitlistPage"));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh] w-full">
    <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function DashboardPage() {
  const { user, logout, updateUser } = useAuth();
  const role = user?.role;

  if (role === "INFRASTRUCTURE_PROVIDER") {
    return (
      <Suspense fallback={<PageLoader />}>
        <ProviderDashboardPage />
      </Suspense>
    );
  }

  if (role === "ADMIN") {
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