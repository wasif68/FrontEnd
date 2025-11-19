/**
 * Login Page Component
 *
 * This page handles user authentication using CSV database:
 * - Displays login form with email and password fields
 * - Validates user credentials against CSV database using findUserByEmail() and validateLogin()
 * - Supports admin login (admin/admin)
 * - Redirects to home page after successful login
 * - Shows error messages for invalid credentials
 * - Uses CSV file (d.csv) as the user database
 *
 * Part of the app: Authentication system
 * UI location: Full-screen centered login form
 * Manages: User login, CSV database authentication, session creation
 */

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, getCurrentUser } from "../services/authService";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      navigate("/recommendations", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Basic validation
      if (!form.email || !form.password) {
        setError("Please fill in all fields");
        setLoading(false);
        return;
      }

      // Attempt login using auth service (now async with CSV)
      const result = await loginUser(form.email, form.password);

      if (result.success) {
        navigate("/recommendations");
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("An error occurred during login. Please try again.");
      console.error("Login error:", err);
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
                  style={{
                    background: "#3a1f1f",
                    color: "#ff6b6b",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #5a2f2f",
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
                <span style={{ color: "#8896ab" }}>
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
