import React from "react";
import DashboardComponent from "../components/Dashboard";
import { useAuth } from "../context/AuthContext";

export default function DashboardPage() {
  const { user, logout, updateUser } = useAuth();
  return (
    <DashboardComponent
      user={user}
      onLogout={logout}
      onRestartOnboarding={() =>
        updateUser({ onboarding_completed: false })
      }
    />
  );
}
