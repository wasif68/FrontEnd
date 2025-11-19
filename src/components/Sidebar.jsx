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

import { getProfile } from "../utils/storage";
import { calculateProfileCompletion } from "../utils/helpers";
import { getCurrentUser } from "../services/authService";
import { getAvatarUrl } from "../utils/avatars";

export default function Sidebar() {
  const profile = getProfile();
  const completion = calculateProfileCompletion(profile);
  const currentUser = getCurrentUser();
  const avatarSrc =
    currentUser?.avatarUrl || getAvatarUrl(currentUser?.avatar) || "https://i.pravatar.cc/80";
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
          <div style={{ fontWeight: 600 }}>{displayName}</div>
          <div style={{ color: "#8896ab", fontSize: 13 }}>{subTitle}</div>
        </div>
      </div>
      <div className="card">
        <strong>Profile completion</strong>
        <div
          style={{
            height: 8,
            background: "#23364a",
            borderRadius: 8,
            marginTop: 10,
          }}
        >
          <div
            style={{
              height: 8,
              width: `${completion}%`,
              background: "#51a7f8",
              borderRadius: 8,
            }}
          ></div>
        </div>
        <div style={{ marginTop: 8, fontSize: 13, color: "#8896ab" }}>
          Complete profile for better recommendations
        </div>
      </div>
      <div className="card">
        <strong>Quick links</strong>
        <div className="inline" style={{ marginTop: 10 }}>
          <a className="link" href="#/profile">
            Edit Profile
          </a>
          <a className="link" href="#/recommendations">
            Recommendations
          </a>
        </div>
      </div>
    </aside>
  );
}
