/**
 * Protected Route Component
 *
 * This component acts as a security guard for protected pages:
 * - Checks if user is logged in before allowing access
 * - Redirects to login page if user is not authenticated
 * - Wraps protected pages like Profile and Recommendations
 *
 * Part of the app: Authentication and routing
 * Manages: Route protection, authentication checks, redirects
 */

import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/services/authService";

export default function ProtectedRoute({ children }) {
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const location = useLocation();

  // Re-check user on mount and when location changes (to catch login state changes)
  useEffect(() => {
    const checkUser = () => {
      const user = getCurrentUser();
      setCurrentUser(user);
      return user;
    };

    // Check immediately
    checkUser();

    // Also check periodically for a short time after mount (catches rapid login)
    // This handles the case where user logs in and navigates quickly
    const interval = setInterval(() => {
      const latestUser = checkUser();
      // If user is found, we can stop checking
      if (latestUser) {
        clearInterval(interval);
      }
    }, 100);

    // Clear interval after 3 seconds (enough time for login to complete)
    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [location.pathname]);

  if (!currentUser) {
    // Save the attempted location to redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
