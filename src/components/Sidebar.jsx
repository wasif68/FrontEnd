/**
 * Sidebar Component
 *
 * This component displays the left sidebar navigation panel that shows:
 * - User profile summary (name, education)
 * - Profile completion progress bar
 * - Quick navigation links to profile and recommendations pages
 *
 * Part of the app: Main layout navigation
 * UI location: Left side of the screen (on authenticated pages)
 * Manages: Profile display, completion tracking, quick navigation
 */

import React from "react";
import { Link } from "react-router-dom";
import { calculateProfileCompletion } from "@/utils/helpers";
import { getCurrentUser } from "@/services/authService";
import { getAvatarUrl } from "@/utils/avatars";
import { loadUserJson } from "@/utils/userStorage";
import "./Sidebar.css";

export default function Sidebar() {
  const currentUser = getCurrentUser();
  const [profile, setProfile] = React.useState({});

  React.useEffect(() => {
    const loadProfile = async () => {
      if (currentUser && currentUser.name) {
        try {
          const userJson = await loadUserJson(currentUser.name);
          if (userJson) {
            setProfile({
              name: userJson.full_name,
              education: userJson.education,
              interests: userJson.interests || [],
              skills: userJson.skills || [],
            });
          }
        } catch (error) {
          console.error("Error loading profile in Sidebar:", error);
          // Keep existing profile state on error
        }
      }
    };
    loadProfile();
  }, [currentUser?.name]); // Only depend on name, not entire object

  const completion = calculateProfileCompletion(profile);
  const avatarSrc =
    currentUser?.avatarUrl ||
    getAvatarUrl(currentUser?.avatar) ||
    "https://i.pravatar.cc/80";
  const displayName = profile.name || currentUser?.name || "Guest User";
  const subTitle =
    profile.education ||
    currentUser?.country ||
    "Complete your profile for better matches";

  return (
    <aside className="sidebar">
      <div className="profile-card">
        <img src={avatarSrc} alt="profile" />
        <div>
          <div className="profile-info">{displayName}</div>
          <div className="profile-subtext">{subTitle}</div>
        </div>
      </div>
      <div className="card">
        <strong>Profile completion</strong>
        <div className="progress-bar-container">
          <div
            className="progress-bar"
            style={{ width: `${completion}%` }}
          ></div>
        </div>
      </div>
      <div className="card">
        <strong>Quick links</strong>
        <div className="quick-links">
          <Link
            className="link"
            to="/dashboard?tab=profile"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            Edit Profile
          </Link>
          <Link
            className="link"
            to="/dashboard?tab=recommendations"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            Recommendations
          </Link>
          <Link
            className="link"
            to="/dashboard?tab=skills"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            Skills
          </Link>
          <Link
            className="link"
            to="/dashboard?tab=courses"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            Courses
          </Link>
        </div>
      </div>
    </aside>
  );
}
