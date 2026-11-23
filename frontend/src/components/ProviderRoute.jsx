import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { RouteSkeleton } from "./ui";

export default function ProviderRoute({ children }) {
  const { isLoggedIn, loading, user } = useAuth();
  const location = useLocation();

  if (loading) return <RouteSkeleton variant="dashboard" />;

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== "INFRASTRUCTURE_PROVIDER") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}