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
import { useUserData } from "@/contexts/UserDataContext"; // Import useUserData

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshUserData, setUser } = useUserData(); // Use refreshUserData and setUser from context

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

      // Attempt login using the refactored auth service (API call)
      const loggedInUser = await loginUser(form.email, form.password);
      setUser(loggedInUser); // Set user in context after successful login (this also calls refreshUserData internally)
      // Note: refreshUserData is called automatically by setUser, so we don't need to call it again
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.message ||
          "An unexpected error occurred during login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell auth-shell">
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
                <span className="text-muted">
                  Don't have an account?{" "}
                </span>
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
