import React, { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
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

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh] w-full">
    <div className="w-8 h-8 border-2 border-[#C9A15A] border-t-transparent rounded-full animate-spin" />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
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

            {/* Catch-all */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
