/**
 * Main App Component
 *
 * This is the root component that controls the entire application:
 * - Sets up routing for all pages (Login, Signup, Profile, Recommendations)
 * - Manages layout structure (Navbar, Sidebar, Main content)
 * - Initializes admin user on app startup
 * - Handles authentication page layout vs. authenticated page layout
 * - Protects routes that require login
 *
 * Part of the app: Application root and routing
 * Manages: Page routing, layout structure, authentication flow, admin initialization
 */

import Navbar from "./components/Navbar.jsx";
import Sidebar from "./components/Sidebar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ProfileQuizPage from "./pages/ProfileQuizPage.jsx";
import CareerFeed from "./pages/CareerFeed.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { initializeAdminUser } from "./services/authService";
import "./App.css";

export default function App() {
  const location = useLocation();
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/signup";

  // Initialize admin user on app start
  useEffect(() => {
    initializeAdminUser().catch(console.error);
  }, []);

  // Auth pages render their own complete structure, so we skip the normal layout
  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Routes>
    );
  }

  // Normal app layout for authenticated pages
  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-body">
        <Sidebar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfileQuizPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recommendations"
              element={
                <ProtectedRoute>
                  <CareerFeed />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
        <aside className="app-right">
          <div className="tip-card">
            <h4>Tips</h4>
            <p>Update your profile for better matches!</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
