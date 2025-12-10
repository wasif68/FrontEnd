/**
 * Recommendations Tab Component (Enhanced)
 *
 * LinkedIn-style job cards with search, filters, and modern UI
 * Now with functional Apply, Save, and Share buttons using backend API
 */

import { useEffect, useState, useCallback } from "react";
import catalog from "@/data/careers_bd.json";
import { findOverlap, containsAny } from "@/utils/helpers";
import { getCurrentUser } from "@/services/authService.js";
import { db } from "@/config/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { useUserData } from "@/contexts/UserDataContext";
import {
  applyToJob,
  saveJob,
  unsaveJob,
  shareJob,
} from "@/services/jobService";
import { loadUserJson, saveUserDataDual } from "@/utils/userStorage";
import { copyToClipboard } from "@/utils/clipboard";
import Toast from "@/components/Toast";
import "./RecommendationsTab.css";

export default function RecommendationsTab({
  profile: externalProfile,
  onProfileUpdate,
}) {
  const currentUser = getCurrentUser();
  const {
    isJobApplied,
    isJobSaved,
    updateAppliedJobs,
    updateSavedJobs,
    refreshUserData,
  } = useUserData();

  const [profile, setProfile] = useState({ skills: [], interests: [] });
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [sortBy, setSortBy] = useState("relevance"); // relevance, score, company
  const [expandedReasons, setExpandedReasons] = useState(new Set());
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState({});

  // Load profile from user JSON or use external profile
  useEffect(() => {
    if (externalProfile && Object.keys(externalProfile).length > 0) {
      setProfile(externalProfile);
      return;
    }

    // Load profile from Firestore
    const loadProfile = async () => {
      if (currentUser && currentUser.id) {
        try {
          // Load user profile from Firestore
          const profileDoc = await getDoc(
            doc(db, "user_profiles", currentUser.id)
          );
          if (profileDoc.exists()) {
            const profileData = profileDoc.data();
            setProfile({
              name: currentUser.name,
              education: profileData.education,
              interests: profileData.interests || [],
              skills: profileData.skills_selected || [],
            });
            return;
          }
        } catch (error) {
          console.warn("Error loading profile from Firestore:", error);
        }
      }

      // Fallback: use currentUser data if available
      if (currentUser) {
        setProfile({
          skills: currentUser.skills || [],
          interests: currentUser.interests || [],
        });
      }
    };
    loadProfile();
  }, [externalProfile, currentUser]);

  // Score careers based on user profile
  const scored = catalog
    .map((c) => {
      const skillHits = findOverlap(profile.skills, c.skills).length;
      const title = c.title.toLowerCase();
      const interestHits = containsAny(title, profile.interests || []) ? 1 : 0;
      const score = skillHits * 2 + interestHits;
      const matchPercentage = Math.min(100, (score / 10) * 100); // Max score is ~10
      return {
        ...c,
        score,
        skillHits,
        matchPercentage,
        matchedSkills: findOverlap(profile.skills, c.skills),
        // Simulated company rating (in real app, this would come from API)
        companyRating: (Math.random() * 2 + 3).toFixed(1), // 3.0-5.0
        companyReviews: Math.floor(Math.random() * 500 + 50), // 50-550 reviews
      };
    })
    .sort((a, b) => {
      if (sortBy === "score") return b.score - a.score;
      if (sortBy === "company") return a.company.localeCompare(b.company);
      return b.score - a.score; // default: relevance
    })
    .filter((job) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = job.title.toLowerCase().includes(query);
        const matchesCompany = job.company.toLowerCase().includes(query);
        const matchesLocation = job.location.toLowerCase().includes(query);
        const matchesSkills = job.skills.some((s) =>
          s.toLowerCase().includes(query)
        );
        if (
          !matchesTitle &&
          !matchesCompany &&
          !matchesLocation &&
          !matchesSkills
        ) {
          return false;
        }
      }
      // Location filter
      if (locationFilter) {
        if (
          !job.location.toLowerCase().includes(locationFilter.toLowerCase())
        ) {
          return false;
        }
      }
      return true;
    });

  // Get unique locations for filter
  const locations = [...new Set(catalog.map((job) => job.location))].sort();

  // Handle Apply button
  const handleApply = useCallback(
    async (jobId) => {
      if (!currentUser?.id) {
        setToast({ message: "Please log in to apply", type: "error" });
        return;
      }

      setLoading((prev) => ({ ...prev, [`apply-${jobId}`]: true }));

      try {
        // Optimistic update
        updateAppliedJobs(jobId, true);

        await applyToJob(currentUser.id, jobId);
        setToast({
          message: "Application submitted successfully!",
          type: "success",
        });

        // Refresh user data to ensure consistency
        refreshUserData();
      } catch (error) {
        // Rollback optimistic update
        updateAppliedJobs(jobId, false);
        setToast({
          message: error.message || "Failed to apply. Please try again.",
          type: "error",
        });
      } finally {
        setLoading((prev) => {
          const newLoading = { ...prev };
          delete newLoading[`apply-${jobId}`];
          return newLoading;
        });
      }
    },
    [currentUser?.id, updateAppliedJobs, refreshUserData]
  );

  // Handle Save/Unsave button
  const handleSave = useCallback(
    async (jobId, shouldSave) => {
      if (!currentUser?.id) {
        setToast({ message: "Please log in to save jobs", type: "error" });
        return;
      }

      setLoading((prev) => ({ ...prev, [`save-${jobId}`]: true }));

      try {
        // Optimistic update
        updateSavedJobs(jobId, shouldSave);

        if (shouldSave) {
          await saveJob(currentUser.id, jobId);

          // Also update recommendations_selected in user profile
          try {
            const userJson = await loadUserJson(currentUser.name);
            if (userJson) {
              const job = catalog.find((c) => c.id === jobId);
              if (job) {
                const currentSelected = userJson.recommendations_selected || [];
                const updatedSelected = currentSelected.includes(job.title)
                  ? currentSelected
                  : [...currentSelected, job.title];

                const updatedData = {
                  ...userJson,
                  recommendations_selected: updatedSelected,
                };

                await saveUserDataDual(updatedData);
              }
            }
          } catch (err) {
            console.warn("Error updating recommendations_selected:", err);
            // Don't fail the save operation if this fails
          }

          setToast({ message: "Job saved successfully!", type: "success" });
        } else {
          await unsaveJob(currentUser.id, jobId);

          // Also remove from recommendations_selected
          try {
            const userJson = await loadUserJson(currentUser.name);
            if (userJson) {
              const job = catalog.find((c) => c.id === jobId);
              if (job) {
                const currentSelected = userJson.recommendations_selected || [];
                const updatedSelected = currentSelected.filter(
                  (title) => title !== job.title
                );

                const updatedData = {
                  ...userJson,
                  recommendations_selected: updatedSelected,
                };

                await saveUserDataDual(updatedData);
              }
            }
          } catch (err) {
            console.warn("Error updating recommendations_selected:", err);
            // Don't fail the unsave operation if this fails
          }

          setToast({ message: "Job unsaved", type: "info" });
        }

        // Refresh user data to ensure consistency
        refreshUserData();
      } catch (error) {
        // Rollback optimistic update
        updateSavedJobs(jobId, !shouldSave);
        setToast({
          message: error.message || "Failed to save. Please try again.",
          type: "error",
        });
      } finally {
        setLoading((prev) => {
          const newLoading = { ...prev };
          delete newLoading[`save-${jobId}`];
          return newLoading;
        });
      }
    },
    [currentUser?.id, currentUser?.name, updateSavedJobs, refreshUserData]
  );

  // Handle Share button
  const handleShare = useCallback(
    async (jobId) => {
      if (!currentUser?.id) {
        setToast({ message: "Please log in to share jobs", type: "error" });
        return;
      }

      setLoading((prev) => ({ ...prev, [`share-${jobId}`]: true }));

      try {
        const shareUrl = await shareJob(currentUser.id, jobId);

        // Copy to clipboard
        const copied = await copyToClipboard(shareUrl);
        if (copied) {
          setToast({
            message: "Share link copied to clipboard!",
            type: "success",
          });
        } else {
          setToast({ message: `Share link: ${shareUrl}`, type: "info" });
        }
      } catch (error) {
        setToast({
          message:
            error.message || "Failed to generate share link. Please try again.",
          type: "error",
        });
      } finally {
        setLoading((prev) => {
          const newLoading = { ...prev };
          delete newLoading[`share-${jobId}`];
          return newLoading;
        });
      }
    },
    [currentUser?.id]
  );

  return (
    <div className="recommendations-container">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {/* Header with Search and Filters */}
      <div className="recommendations-header">
        <div className="recommendations-header-top">
          <h2>Recommended Jobs</h2>
          <div className="recommendations-count">
            {scored.length} {scored.length === 1 ? "job" : "jobs"} found
          </div>
        </div>

        {/* Search Bar */}
        <div className="search-filters">
          <div className="search-bar">
            <svg
              className="search-icon"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input
              type="text"
              placeholder="Search jobs, companies, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button
                className="clear-search"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="filters-row">
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="relevance">Sort by: Relevance</option>
              <option value="score">Sort by: Match Score</option>
              <option value="company">Sort by: Company</option>
            </select>
          </div>
        </div>
      </div>

      {/* Job Cards */}
      <div className="jobs-grid">
        {scored.length === 0 ? (
          <div className="no-results">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <h3>No jobs found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          scored.map((job) => {
            const isSaved = isJobSaved(job.id);
            const isApplied = isJobApplied(job.id);
            const isApplyLoading = loading[`apply-${job.id}`];
            const isSaveLoading = loading[`save-${job.id}`];
            const isShareLoading = loading[`share-${job.id}`];

            return (
              <div
                key={job.id}
                className={`job-card transition-all duration-150 ease-in-out transform hover:scale-102 active:scale-95 active:shadow-md ${
                  isSaved ? "saved" : ""
                }`}
              >
                {/* Job Header */}
                <div className="job-card-header">
                  <div className="job-card-main">
                    <h3 className="job-title">{job.title}</h3>
                    <div className="job-company">
                      <span className="company-name">{job.company}</span>
                      {job.companyRating && (
                        <div className="company-rating">
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          <span>{job.companyRating}</span>
                          <span className="reviews-count">
                            ({job.companyReviews})
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="job-location">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {job.location}
                    </div>
                  </div>

                  {/* Match Score Badge - Color Coded */}
                  <div
                    className={`match-badge match-${
                      job.matchPercentage >= 70
                        ? "high"
                        : job.matchPercentage >= 40
                        ? "medium"
                        : "low"
                    }`}
                  >
                    <div className="match-score">{job.matchPercentage}%</div>
                    <div className="match-label">Match</div>
                  </div>
                </div>

                {/* Match Progress Bar */}
                <div className="match-progress">
                  <div
                    className="match-progress-bar"
                    style={{ width: `${job.matchPercentage}%` }}
                  />
                </div>

                {/* Job Description */}
                <p className="job-description">{job.description}</p>

                {/* Skills Tags */}
                <div className="job-skills">
                  {job.skills.map((skill) => {
                    const isMatched = job.matchedSkills.includes(skill);
                    return (
                      <span
                        key={skill}
                        className={`skill-tag ${isMatched ? "matched" : ""}`}
                        title={isMatched ? "You have this skill" : ""}
                      >
                        {skill}
                        {isMatched && (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                          </svg>
                        )}
                      </span>
                    );
                  })}
                </div>

                {/* Match Reason - Collapsible */}
                {job.matchedSkills.length > 0 && (
                  <div className="match-reason-container">
                    <button
                      className="match-reason-toggle transition-all duration-150 ease-in-out transform hover:scale-105 active:scale-95 active:shadow-md"
                      onClick={() => {
                        const newExpanded = new Set(expandedReasons);
                        if (newExpanded.has(job.id)) {
                          newExpanded.delete(job.id);
                        } else {
                          newExpanded.add(job.id);
                        }
                        setExpandedReasons(newExpanded);
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        className={`match-reason-icon ${
                          expandedReasons.has(job.id) ? "expanded" : ""
                        }`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                      <span>
                        Why this matches ({job.matchedSkills.length} skills)
                      </span>
                    </button>
                    {expandedReasons.has(job.id) && (
                      <div className="match-reason-content">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        <span>
                          Matched skills:{" "}
                          <strong>{job.matchedSkills.join(", ")}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="job-actions">
                  {isSaved ? (
                    <button
                      className="btn-action saved-btn transition-all duration-150 ease-in-out transform hover:scale-105 active:scale-95 active:shadow-md"
                      onClick={() => handleSave(job.id, false)}
                      disabled={isSaveLoading}
                      aria-label="Unsave job"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                      </svg>
                      {isSaveLoading ? "..." : "Saved"}
                    </button>
                  ) : (
                    <button
                      className="btn-action transition-all duration-150 ease-in-out transform hover:scale-105 active:scale-95 active:shadow-md"
                      onClick={() => handleSave(job.id, true)}
                      disabled={isSaveLoading}
                      aria-label="Save job"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                      {isSaveLoading ? "..." : "Save"}
                    </button>
                  )}
                  <button
                    className="btn-action transition-all duration-150 ease-in-out transform hover:scale-105 active:scale-95 active:shadow-md"
                    onClick={() => handleShare(job.id)}
                    disabled={isShareLoading}
                    aria-label="Share job"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                    {isShareLoading ? "..." : "Share"}
                  </button>
                  {isApplied ? (
                    <button
                      className="btn-action primary saved-btn transition-all duration-150 ease-in-out transform hover:scale-105 active:scale-95 active:shadow-md"
                      disabled
                      aria-label="Already applied"
                    >
                      Applied
                    </button>
                  ) : (
                    <button
                      className="btn-action primary transition-all duration-150 ease-in-out transform hover:scale-105 active:scale-95 active:shadow-md"
                      onClick={() => handleApply(job.id)}
                      disabled={isApplyLoading}
                      aria-label="Apply to job"
                    >
                      {isApplyLoading ? "..." : "Apply"}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
