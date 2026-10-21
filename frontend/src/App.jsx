import React, { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ConfirmProvider } from "./context/ConfirmContext";
import { SidebarProvider } from "./context/SidebarContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

// Eager load primary landing entry
import LandingPage from "./Pages/LandingPage";

/**
 * Safe lazy loader with auto-reload retry if a new deployment changed JS chunk hashes.
 */
function lazyWithRetry(componentImport) {
  return lazy(async () => {
    const pageHasAlreadyBeenReloaded = JSON.parse(
      window.sessionStorage.getItem("chunk_reload_retry") || "false"
    );

    try {
      const component = await componentImport();
      window.sessionStorage.removeItem("chunk_reload_retry");
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenReloaded) {
        window.sessionStorage.setItem("chunk_reload_retry", "true");
        window.location.reload();
      }
      throw error;
    }
  });
}

// Code-split secondary routes with lazyWithRetry
const LoginPage = lazyWithRetry(() => import("./Pages/LoginPage"));
const SignupPage = lazyWithRetry(() => import("./Pages/SignupPage"));
const DashboardPage = lazyWithRetry(() => import("./Pages/DashboardPage"));
const NotFoundPage = lazyWithRetry(() => import("./Pages/NotFoundPage"));
const ForgotPasswordPage = lazyWithRetry(() => import("./Pages/ForgotPasswordPage"));
const FounderIntakePage = lazyWithRetry(() => import("./Pages/FounderIntakePage"));
const FounderAnalysisPage = lazyWithRetry(() => import("./Pages/FounderAnalysisPage"));
const FounderRoadmapPage = lazyWithRetry(() => import("./Pages/FounderRoadmapPage"));
const VenturesPage = lazyWithRetry(() => import("./Pages/VenturesPage"));
const FounderHubPage = lazyWithRetry(() => import("./Pages/FounderHubPage"));
const FounderValidationPage = lazyWithRetry(() => import("./Pages/FounderValidationPage"));
const FounderAiToolsPage = lazyWithRetry(() => import("./Pages/FounderAiToolsPage"));
const FounderProductPage = lazyWithRetry(() => import("./Pages/FounderProductPage"));
const FounderLegalPage = lazyWithRetry(() => import("./Pages/FounderLegalPage"));
const FounderOutreachPage = lazyWithRetry(() => import("./Pages/FounderOutreachPage"));
const AdminWaitlistPage = lazyWithRetry(() => import("./Pages/AdminWaitlistPage"));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh] w-full">
    <div className="w-8 h-8 border-2 border-[#C9A15A] border-t-transparent rounded-full animate-spin" />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <SidebarProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
          {/* Main Layout Wrapper - Navbar & Background are rendered via Layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/register" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/founder"
              element={
                <ProtectedRoute>
                  <FounderHubPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/founder/intake"
              element={
                <ProtectedRoute>
                  <FounderIntakePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/founder/analysis"
              element={
                <ProtectedRoute>
                  <FounderAnalysisPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/founder/roadmap"
              element={
                <ProtectedRoute>
                  <FounderRoadmapPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/founder/ventures"
              element={
                <ProtectedRoute>
                  <VenturesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/founder/validation"
              element={
                <ProtectedRoute>
                  <FounderValidationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/founder/ai-tools"
              element={
                <ProtectedRoute>
                  <FounderAiToolsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/founder/product"
              element={
                <ProtectedRoute>
                  <FounderProductPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/founder/legal"
              element={
                <ProtectedRoute>
                  <FounderLegalPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/founder/outreach"
              element={
                <ProtectedRoute>
                  <FounderOutreachPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/waitlist"
              element={
                <ProtectedRoute>
                  <AdminWaitlistPage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
          </SidebarProvider>
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
