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
import { getCurrentUser } from "@/services/authService";

export default function ProtectedRoute({ children }) {
  const currentUser = getCurrentUser();
  const location = useLocation();

  if (!currentUser) {
    // Save the attempted location to redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
