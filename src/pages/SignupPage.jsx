/**
 * Sign Up Page Component
 *
 * This page handles new user registration with CSV database:
 * - Displays signup form with all required fields (name, email, password, confirm password, gender, year, country)
 * - Validates form inputs (empty fields, email format, password match, minimum length)
 * - Checks if email address already exists in CSV database
 * - Creates new user account and saves to CSV file
 * - Shows error message if account already exists: "Account already exists. Please log in instead."
 * - Auto-logs in user after successful registration
 * - Shows success message and redirects to home page
 *
 * Part of the app: Authentication system
 * UI location: Full-screen centered signup form
 * Manages: User registration, account creation, CSV database operations, validation
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";

// Country options for dropdown
const countries = [
  "Bangladesh",
  "India",
  "Pakistan",
  "Nepal",
  "Sri Lanka",
  "Malaysia",
  "Australia",
  "UK",
  "USA",
  "Canada",
  "Other",
];

// Generate birth year options (1950 to current year)
const currentYear = new Date().getFullYear();
const birthYears = Array.from({ length: currentYear - 1949 }, (_, i) =>
  String(currentYear - i)
);

export default function SignupPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "",
    year: "",
    country: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      // Attempt registration using auth service (now async)
      const result = await registerUser(
        form.name,
        form.email,
        form.password,
        form.confirmPassword,
        form.gender,
        form.year,
        form.country
      );

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate("/recommendations");
        }, 1500);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell auth-shell">
      <div className="app-body auth-page">
        <div className="app-main">
          <div className="card">
            <h2>Sign Up</h2>
            <form className="form" onSubmit={handleSubmit}>
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
              {success && (
                <div
                  style={{
                    background: "#1f3a1f",
                    color: "#6bff6b",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #2f5a2f",
                  }}
                >
                  Account created successfully! Redirecting...
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
              <div>
                <select
                  className="select"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  style={{ width: "100%" }}
                  required
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <select
                  className="select"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  style={{ width: "100%" }}
                  required
                >
                  <option value="">Select birth year</option>
                  {birthYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  className="select"
                  value={form.country}
                  onChange={(e) =>
                    setForm({ ...form, country: e.target.value })
                  }
                  style={{ width: "100%" }}
                  required
                >
                  <option value="">Select country</option>
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
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
                <span style={{ color: "#8896ab" }}>
                  Already have an account?{" "}
                </span>
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
