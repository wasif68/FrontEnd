/**
 * Navbar Component
 *
 * This component displays the top navigation bar that includes:
 * - App logo/brand name (CareerAI)
 * - Navigation links (Home, My Profile)
 * - Current user's name display
 * - Logout button
 * - User profile image
 *
 * Part of the app: Main layout navigation
 * UI location: Top of the screen (sticky header)
 * Manages: Navigation, user session display, logout functionality
 */

import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getCurrentUser, logoutUser } from "../services/authService";
import { getAvatarUrl } from "../utils/avatars";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  const avatarSrc =
    user?.avatarUrl || getAvatarUrl(user?.avatar) || "https://i.pravatar.cc/40";

  return (
    <header className="navbar">
      <span style={{ fontWeight: 700, letterSpacing: ".7px", fontSize: 22 }}>
        CareerAI
      </span>
      <nav style={{ display: "flex", gap: "20px", alignItems: "center" }}>
        <Link to="/recommendations" className="link">
          Home
        </Link>
        <Link to="/profile" className="link">
          My Profile
        </Link>
        {user && (
          <span style={{ color: "#8896ab", fontSize: "14px" }}>
            {user.name}
          </span>
        )}
        {user && (
          <button
            onClick={handleLogout}
            className="btn"
            style={{ padding: "6px 14px", fontSize: "14px" }}
          >
            Logout
          </button>
        )}
        <img
          src={avatarSrc}
          width="36"
          height="36"
          style={{ borderRadius: "50%" }}
          alt="User avatar"
        />
      </nav>
    </header>
  );
}
