/**
 * Sign Up Page Component (Refactored for Backend API)
 *
 * This page handles new user registration by interacting with the backend API.
 * - Displays signup form with name, email, and password fields.
 * - Sends credentials to the backend for validation and account creation.
 * - Shows error messages for invalid inputs or API issues.
 * - Navigates to the recommendations page after successful registration.
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "@/services/authService";
import Toast from "@/components/Toast";

export default function SignupPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Basic client-side validation (for fields not yet handled by backend or for immediate feedback)
      if (
        !form.name ||
        !form.email ||
        !form.password ||
        !form.confirmPassword
      ) {
        setError("Please fill in all fields");
        setLoading(false); // ADD THIS LINE
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match");
        setLoading(false); // ADD THIS LINE
        return;
      }
      // Frontend can still enforce password length visually or with simple checks before API call if desired
      if (form.password.length < 6) {
        setError("Password must be at least 6 characters");
        setLoading(false); // ADD THIS LINE
        return;
      }

      // Attempt registration using the refactored auth service
      await registerUser({
        name: form.name,
        email: form.email,
        password: form.password,
      });

      // Show success toast
      setToast({
        message: "Account created successfully! Redirecting to login...",
        type: "success",
      });
      setLoading(false);

      // Small delay to show success message, then navigate to login
      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (err) {
      console.error("Registration error:", err);
      const errorMessage =
        err.message ||
        "An unexpected error occurred during registration. Please try again.";
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
            <h2>Sign Up</h2>
            <form className="form" onSubmit={handleSubmit}>
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
                  type="text"
                  placeholder="Full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{ width: "100%" }}
                  required
                />
              </div>
              <div>
                <input
                  className="input"
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
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
                  style={{ width: "100%" }}
                  required
                />
              </div>
              <div>
                <input
                  className="input"
                  type="password"
                  placeholder="Confirm password"
                  value={form.confirmPassword}
                  onChange={(e) =>
                    setForm({ ...form, confirmPassword: e.target.value })
                  }
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
                  {loading ? "Creating Account..." : "Create Account"}
                </button>
              </div>
              <div style={{ textAlign: "center", marginTop: 12 }}>
                <span className="text-muted">Already have an account? </span>
                <Link className="link" to="/login">
                  Login
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
