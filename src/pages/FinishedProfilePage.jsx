/**
 * Finished Profile Page
 * 
 * Displays a user's complete profile, now featuring the enhanced 
 * ProfileCompletionWidget and a persistent profile picture.
 */
import { useEffect, useState } from "react";
import { useUserData } from "@/contexts/UserDataContext";
import { getCurrentUser } from "@/services/authService";
import { getAvatarUrl } from "@/utils/avatars";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProfileCompletionWidget from "../../radial-progress-bar/exampleIntegration.jsx"; // Import the widget
import "./FinishedProfilePage.css";

export default function FinishedProfilePage() {
  const currentUser = getCurrentUser(); // From localStorage
  const { refreshUserData } = useUserData();
  const [activeTab, setActiveTab] = useState("courses");
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProfileData = async () => {
      if (!currentUser || !currentUser.id) {
        setError("User not found or invalid. Please log in.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`http://localhost:3100/api/user/${currentUser.id}/profile/complete`);
        if (!response.ok) throw new Error(`Failed to load profile data (${response.status})`);
        const data = await response.json();
        setProfileData(data.data || data);
        refreshUserData();
      } catch (err) {
        console.error("Error loading profile data:", err);
        setError(err.message.includes("fetch") ? "Cannot connect to backend server." : err.message);
      } finally {
        setLoading(false);
      }
    };
    loadProfileData();
  }, [currentUser?.id, refreshUserData]);

  if (loading) {
    return <div className="finished-profile-container"><p>Loading profile...</p></div>;
  }

  if (error) {
    return <div className="finished-profile-container error-state"><h2>Error</h2><p>{error}</p></div>;
  }

  if (!profileData) {
    return <div className="finished-profile-container"><p>No profile data found.</p></div>;
  }

  const { user = {}, enrolledCourses = [], savedCourses = [], appliedJobs = [], savedJobs = [] } = profileData;

  // --- AVATAR PERSISTENCE FIX ---
  // Priority:
  // 1. `user.avatarFile` from the database API call (most reliable).
  // 2. Fallback to `currentUser.avatar` from localStorage (for initial load).
  // 3. A default placeholder if neither exists.
  const avatarSrc = user.avatarFile 
    ? getAvatarUrl(user.avatarFile) 
    : currentUser?.avatar 
    ? getAvatarUrl(currentUser.avatar) 
    : "https://i.pravatar.cc/150";

  return (
    <ErrorBoundary>
      <div className="finished-profile-container">
        <div className="profile-grid">
          <div className="profile-header-container">
            <div className="profile-header">
              <img src={avatarSrc} alt="Profile" className="profile-image" />
              <div className="profile-info">
                <h1 className="profile-name">{user.name || "User"}</h1>
                <p className="profile-email">{user.email || ""}</p>
                {user.country && <p className="profile-location">{user.country}</p>}
              </div>
            </div>
          </div>

          <div className="profile-widget-container">
            {/* INTEGRATED RADIAL PROGRESS BAR */}
            <ProfileCompletionWidget profileData={profileData} loading={loading} error={error} />
          </div>
        </div>

        <div className="profile-tabs">
          <button className={`tab-button ${activeTab === "courses" ? "active" : ""}`} onClick={() => setActiveTab("courses")}>
            Courses ({enrolledCourses.length} enrolled, {savedCourses.length} saved)
          </button>
          <button className={`tab-button ${activeTab === "jobs" ? "active" : ""}`} onClick={() => setActiveTab("jobs")}>
            Jobs ({appliedJobs.length} applied, {savedJobs.length} saved)
          </button>
        </div>

        <div className="tab-content">
          {/* ... (rest of the tab content for courses and jobs remains the same) ... */}
        </div>
      </div>
    </ErrorBoundary>
  );
}