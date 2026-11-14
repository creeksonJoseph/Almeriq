import React, { lazy, Suspense } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ConfirmProvider } from "./context/ConfirmContext";
import { SidebarProvider } from "./context/SidebarContext";
import { IdeaProvider } from "./context/IdeaContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ProviderRoute from "./components/ProviderRoute";
import Layout from "./components/Layout";

// Eager load primary landing entry
import LandingPage from "./Pages/shared/LandingPage";

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
const LoginPage = lazyWithRetry(() => import("./Pages/auth/LoginPage"));
const SignupPage = lazyWithRetry(() => import("./Pages/auth/SignupPage"));
const DashboardPage = lazyWithRetry(() => import("./Pages/shared/DashboardPage"));
const NotFoundPage = lazyWithRetry(() => import("./Pages/shared/NotFoundPage"));
const ForgotPasswordPage = lazyWithRetry(() => import("./Pages/auth/ForgotPasswordPage"));

// Founder routes
const FounderIntakePage = lazyWithRetry(() => import("./Pages/founder/FounderIntakePage"));
const FounderAnalysisPage = lazyWithRetry(() => import("./Pages/founder/FounderAnalysisPage"));
const VenturesPage = lazyWithRetry(() => import("./Pages/founder/VenturesPage"));
const FounderValidationPage = lazyWithRetry(() => import("./Pages/founder/FounderValidationPage"));
const FounderProductPage = lazyWithRetry(() => import("./Pages/founder/FounderProductPage"));
const FounderLegalPage = lazyWithRetry(() => import("./Pages/founder/FounderLegalPage"));

// Admin routes
const AdminWaitlistPage = lazyWithRetry(() => import("./Pages/admin/AdminWaitlistPage"));

// Shared routes
const SettingsPage = lazyWithRetry(() => import("./Pages/shared/SettingsPage"));
const AlertsPage = lazyWithRetry(() => import("./Pages/shared/AlertsPage"));
const MessagesPage = lazyWithRetry(() => import("./Pages/shared/MessagesPage"));

// Provider routes
const ProviderSetupPage = lazyWithRetry(() => import("./Pages/provider/ProviderSetupPage"));
const ProviderDashboardPage = lazyWithRetry(() => import("./Pages/provider/ProviderDashboardPage"));
const ProviderListingsPage = lazyWithRetry(() => import("./Pages/provider/ProviderListingsPage"));
const ProviderListingPreviewPage = lazyWithRetry(() => import("./Pages/provider/ProviderListingPreviewPage"));
const ProviderOrdersPage = lazyWithRetry(() => import("./Pages/provider/ProviderOrdersPage"));
const ProviderOrderDetailPage = lazyWithRetry(() => import("./Pages/provider/ProviderOrderDetailPage"));

// Marketplace & Search
const MarketplacePage = lazyWithRetry(() => import("./Pages/marketplace/MarketplacePage"));
const PublicListingPreviewPage = lazyWithRetry(() => import("./Pages/marketplace/PublicListingPreviewPage"));
const SearchPage = lazyWithRetry(() => import("./Pages/marketplace/SearchPage"));

// Checkout
const CheckoutPage = lazyWithRetry(() => import("./Pages/checkout/CheckoutPage"));
const SentryTestPage = lazyWithRetry(() => import("./Pages/checkout/SentryTestPage"));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh] w-full">
    <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <SidebarProvider>
            <IdeaProvider>
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
                      <Navigate to="/dashboard" replace />
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
                      <Navigate to="/founder/analysis" state={{ autoSelectTool: "execution_roadmap" }} replace />
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
                      <Navigate to="/dashboard" replace />
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
                      <Navigate to="/dashboard" replace />
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
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Provider Routes (require INFRASTRUCTURE_PROVIDER role) */}
                <Route
                  path="/provider/setup"
                  element={
                    <ProviderRoute>
                      <ProviderSetupPage />
                    </ProviderRoute>
                  }
                />
                <Route
                  path="/provider/dashboard"
                  element={
                    <ProviderRoute>
                      <ProviderDashboardPage />
                    </ProviderRoute>
                  }
                />
                <Route
                  path="/provider/listings"
                  element={
                    <ProviderRoute>
                      <ProviderListingsPage />
                    </ProviderRoute>
                  }
                />
                <Route
                  path="/provider/listings/:id/preview"
                  element={
                    <ProviderRoute>
                      <ProviderListingPreviewPage />
                    </ProviderRoute>
                  }
                />
                <Route
                  path="/provider/orders"
                  element={
                    <ProviderRoute>
                      <ProviderOrdersPage />
                    </ProviderRoute>
                  }
                />
                <Route
                  path="/provider/orders/:id"
                  element={
                    <ProviderRoute>
                      <ProviderOrderDetailPage />
                    </ProviderRoute>
                  }
                />

                {/* Marketplace (accessible to all logged-in users) */}
                <Route
                  path="/marketplace"
                  element={
                    <ProtectedRoute>
                      <MarketplacePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/listings/:id"
                  element={
                    <ProtectedRoute>
                      <PublicListingPreviewPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/search"
                  element={
                    <ProtectedRoute>
                      <SearchPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/alerts"
                  element={
                    <ProtectedRoute>
                      <AlertsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/messages"
                  element={
                    <ProtectedRoute>
                      <MessagesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/checkout/:orderId"
                  element={
                    <ProtectedRoute>
                      <CheckoutPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/sentry-test" element={<SentryTestPage />} />

                {/* Catch-all */}
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </Suspense>
            </IdeaProvider>
          </SidebarProvider>
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;