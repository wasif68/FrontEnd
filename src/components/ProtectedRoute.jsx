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

import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../services/authService";

export default function ProtectedRoute({ children }) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
