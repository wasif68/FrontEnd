/**
 * Main App Component
 *
 * This is the root component that controls the entire application:
 * - Sets up routing for all pages (Login, Signup, Profile, Recommendations)
 * - Manages layout structure (Navbar, Sidebar, Main content)
 * - Handles authentication page layout vs. authenticated page layout
 * - Protects routes that require login
 *
 * Part of the app: Application root and routing
 * Manages: Page routing, layout structure, authentication flow
 */

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import FinishedProfilePage from "./pages/FinishedProfilePage.jsx";
import SharePage from "./pages/SharePage.jsx";
import "./App.css";
import { ThemeProvider } from "./contexts/ThemeContext";
import { UserDataProvider } from "./contexts/UserDataContext";

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <UserDataProvider>
          <ErrorBoundary message="An error occurred in the application. Please try refreshing.">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/share/:type/:token" element={<SharePage />} />

              {/* Root path - always redirect to login first */}
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* Protected dashboard route */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
              </Route>

              {/* Protected finished profile route */}
              <Route
                path="/finished-profile"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<FinishedProfilePage />} />
              </Route>

              {/* Default redirect to login */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </ErrorBoundary>
        </UserDataProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
