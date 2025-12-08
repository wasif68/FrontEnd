import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getCurrentUser } from "@/services/authService";
import { loadUserJson } from "@/utils/userStorage";
import { getAvatarUrl } from "@/utils/avatars";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProfileTab from "@/components/dashboard/ProfileTab";
import SkillsTab from "@/components/dashboard/SkillsTab";
import RecommendationsTab from "@/components/dashboard/RecommendationsTab";
import CoursesTab from "@/components/dashboard/CoursesTab";

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") || "profile";
  const [activeTab, setActiveTab] = useState(tabParam);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Update activeTab when URL parameter changes - instant update
  useEffect(() => {
    const tabParam = searchParams.get("tab") || "profile";
    setActiveTab(tabParam);
  }, [searchParams]);

  // Load user data in background without blocking UI
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      // Set initial user data immediately from currentUser (synchronous)
      setUser({
        name: currentUser.name || "User",
        email: currentUser.email || "",
        avatar: currentUser.avatar ? getAvatarUrl(currentUser.avatar) : null,
      });
      setLoading(false); // Show UI immediately

      // Load full user data asynchronously in background (non-blocking)
      const loadUserData = async () => {
        try {
          const userJson = await loadUserJson(
            currentUser.id || currentUser.name,
            !!currentUser.id
          );

          if (userJson) {
            const profileImage = userJson.profile_picture
              ? (() => {
                  const fileName = userJson.profile_picture.replace(
                    "Faces/",
                    ""
                  );
                  const imageData = localStorage.getItem(
                    `profile_image_${fileName}`
                  );
                  if (imageData) {
                    try {
                      return JSON.parse(imageData).data;
                    } catch (e) {
                      return getAvatarUrl(fileName);
                    }
                  }
                  return getAvatarUrl(fileName);
                })()
              : currentUser.avatar
              ? getAvatarUrl(currentUser.avatar)
              : null;

            setUser({
              name: userJson.full_name || currentUser.name || "User",
              email: currentUser.email || "",
              avatar: profileImage,
            });
          }
        } catch (error) {
          console.error("Error loading user data:", error);
          // Keep the initial user data, don't clear it
        }
      };

      // Load in background without blocking
      loadUserData();
    } else {
      setLoading(false);
    }
  }, []);

  const handleTabChange = (tab) => {
    // Instant tab change - update state and URL immediately
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  };

  const handleProfileUpdate = () => {
    // Reload user data after profile update
    const currentUser = getCurrentUser();
    if (currentUser) {
      const profileImage = currentUser.avatar
        ? getAvatarUrl(currentUser.avatar)
        : null;
      setUser({
        name: currentUser.name || "User",
        email: currentUser.email || "",
        avatar: profileImage,
      });
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="card p-6 text-center">
          <div className="text-muted">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container min-h-screen bg-background-light dark:bg-background-dark">
      {/* Dashboard Header with Profile Settings Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">
            Dashboard
          </h1>
          {activeTab !== "profile" && (
            <button
              onClick={() => handleTabChange("profile")}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "var(--accent)",
                color: "#ffffff",
                borderRadius: "8px",
                fontWeight: "500",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(81, 167, 248, 0.3)",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "var(--primary)";
                e.target.style.boxShadow = "0 4px 12px rgba(81, 167, 248, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "var(--accent)";
                e.target.style.boxShadow = "0 2px 8px rgba(81, 167, 248, 0.3)";
              }}
            >
              Profile Settings
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <ErrorBoundary message="An error occurred loading this tab. Please try refreshing.">
              {activeTab === "profile" && (
                <ProfileTab onProfileUpdate={handleProfileUpdate} />
              )}
              {activeTab === "skills" && <SkillsTab />}
              {activeTab === "recommendations" && <RecommendationsTab />}
              {activeTab === "courses" && <CoursesTab />}
              {activeTab !== "profile" &&
                activeTab !== "skills" &&
                activeTab !== "recommendations" &&
                activeTab !== "courses" && (
                  <div className="card p-6 text-center">
                    <p className="text-muted">
                      Tab not found. Please use the sidebar links to navigate.
                    </p>
                  </div>
                )}
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default Dashboard;
