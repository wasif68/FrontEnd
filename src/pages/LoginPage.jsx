/**
 * Login Page Component (Refactored for Backend API)
 *
 * This page handles user authentication by interacting with the backend API.
 * - Displays login form with email and password fields.
 * - Sends credentials to the backend for validation.
 * - Redirects to home page after successful login.
 * - Shows error messages for invalid credentials or API issues.
 */

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, getCurrentUser } from "@/services/authService";
import { useUserData } from "@/contexts/UserDataContext";
import Toast from "@/components/Toast";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();
  const { refreshUserData, setUser } = useUserData();

  // Redirect if already logged in
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser); // Set user in context on initial load if already logged in
      navigate("/dashboard", { replace: true });
    }
  }, [navigate, setUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Basic client-side validation
      if (!form.email || !form.password) {
        setError("Please fill in all fields");
        setLoading(false);
        return;
      }

      // Attempt login using the refactored auth service
      console.log("🔐 Starting login process...");
      const loggedInUser = await loginUser(form.email, form.password);
      console.log("✅ Login successful! User:", loggedInUser);

      // Verify user object has required fields
      if (!loggedInUser || (!loggedInUser.email && !loggedInUser.name)) {
        throw new Error("Invalid user data received from server.");
      }

      // Verify user is stored in localStorage
      const storedUser = getCurrentUser();
      if (!storedUser) {
        console.error("❌ User not found in localStorage after login!");
        throw new Error("Failed to store user session.");
      }
      console.log("✅ User confirmed in localStorage:", storedUser);

      // Set user in context (with error handling)
      try {
        console.log("🔄 Setting user in context...");
        setUser(loggedInUser);
        console.log("✅ User set in context");
      } catch (contextError) {
        console.error(
          "⚠️ Error setting user in context (non-blocking):",
          contextError
        );
        // Don't throw - navigation should still happen if user is in localStorage
      }

      // Show success toast immediately for user feedback
      setToast({
        message: "Login successful! Redirecting to dashboard...",
        type: "success",
      });
      setLoading(false); // Stop loading state to show success

      // Ensure user is definitely in localStorage before navigating
      const finalCheck = getCurrentUser();
      if (!finalCheck) {
        throw new Error("Failed to store user session.");
      }

      // Navigate after a brief delay to show success message
      // This gives visual feedback and ensures ProtectedRoute can detect the user
      console.log("🚀 Navigating to dashboard...");
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
        console.log("✅ Navigation called");
      }, 600); // 600ms - enough to see success message, short enough to feel instant
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage =
        err.message ||
        "An unexpected error occurred during login. Please try again.";
      setError(errorMessage);
      setToast({ message: errorMessage, type: "error" });
      setLoading(false);
    }
  };

  return (
    <div className="app-shell auth-shell">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="app-body auth-page">
        <div className="app-main">
          <div className="card">
            <h2>Login</h2>
            <form className="form" onSubmit={handleSubmit} noValidate>
              {error && (
                <div
                  className="error-message"
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                  }}
                >
                  {error}
                </div>
              )}
              <div>
                <input
                  className="input"
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  autoComplete="username"
                  style={{ width: "100%" }}
                  required
                />
              </div>
              <div>
                <input
                  className="input"
                  type="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  autoComplete="current-password"
                  style={{ width: "100%" }}
                  required
                />
              </div>
              <div className="inline" style={{ marginTop: 14 }}>
                <button
                  type="submit"
                  className="btn primary"
                  style={{ flex: 1 }}
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
              </div>
              <div style={{ textAlign: "center", marginTop: 12 }}>
                <span className="text-muted">Don't have an account? </span>
                <Link className="link" to="/signup">
                  Sign up
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
