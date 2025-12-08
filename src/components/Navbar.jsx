/**
 * Navbar Component (Enhanced with Theme Toggle)
 */

import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser, logoutUser } from "@/services/authService";
import { getAvatarUrl } from "@/utils/avatars";
import { useUserData } from "@/contexts/UserDataContext"; // Import useUserData
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const { clearUserData } = useUserData(); // Use clearUserData from context

  const handleLogout = () => {
    logoutUser();
    clearUserData(); // Clear user data from context
    navigate("/login");
  };

  const avatarSrc =
    user?.avatarUrl || getAvatarUrl(user?.avatar) || "https://i.pravatar.cc/40";

  return (
    <header className="navbar">
      <span className="navbar-brand">CareerAI</span>
      <nav className="navbar-nav">
        <Link to="/dashboard" className="navbar-link">
          Dashboard
        </Link>
          <Link to="/finished-profile" className="navbar-link">
            Finished Profile
          </Link>

        {user && (
          <div className="flex items-center gap-4">
            <span className="navbar-user">{user.name}</span>
            <button onClick={handleLogout} className="navbar-logout">
              Logout
            </button>
            <img
              src={avatarSrc}
              width="36"
              height="36"
              className="navbar-avatar"
              alt="User avatar"
            />
          </div>
        )}
      </nav>
    </header>
  );
}
