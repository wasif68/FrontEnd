/**
 * Courses Tab Component
 *
 * Displays courses in a card-style layout similar to Recommendations
 * Supports Enroll, Save, and Share actions with backend API integration
 */

import { useEffect, useState, useCallback } from "react";
import { useUserData } from "@/contexts/UserDataContext";
import { getCurrentUser } from "@/services/authService";
import { getAllCourses, enrollInCourse, saveCourse, unsaveCourse, shareCourse } from "@/services/courseService";
import { copyToClipboard } from "@/utils/clipboard";
import Toast from "@/components/Toast";
import "./CoursesTab.css";

export default function CoursesTab() {
  const currentUser = getCurrentUser();
  const { 
    isCourseEnrolled, 
    isCourseSaved, 
    updateEnrolledCourses, 
    updateSavedCourses,
    refreshUserData 
  } = useUserData();
  
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [providerFilter, setProviderFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [sortBy, setSortBy] = useState("title"); // title, provider, location
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState({});
  const [initialLoading, setInitialLoading] = useState(true);

  // Load courses from API
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setInitialLoading(true);
        const data = await getAllCourses();
        const coursesList = data.courses || data || [];
        setCourses(coursesList);
        setFilteredCourses(coursesList);
      } catch (error) {
        console.error("Error loading courses:", error);
        setToast({ 
          message: "Failed to load courses. Please try again later.", 
          type: "error" 
        });
      } finally {
        setInitialLoading(false);
      }
    };
    loadCourses();
  }, []);

  // Filter and sort courses
  useEffect(() => {
    let filtered = [...courses];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(course => 
        course.title.toLowerCase().includes(query) ||
        course.provider.toLowerCase().includes(query) ||
        course.location.toLowerCase().includes(query) ||
        course.description?.toLowerCase().includes(query) ||
        course.skills?.some(skill => skill.toLowerCase().includes(query))
      );
    }

    // Provider filter
    if (providerFilter) {
      filtered = filtered.filter(course => 
        course.provider.toLowerCase().includes(providerFilter.toLowerCase())
      );
    }

    // Location filter
    if (locationFilter) {
      filtered = filtered.filter(course => 
        course.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "provider") return a.provider.localeCompare(b.provider);
      if (sortBy === "location") return a.location.localeCompare(b.location);
      return a.title.localeCompare(b.title); // default: title
    });

    setFilteredCourses(filtered);
  }, [courses, searchQuery, providerFilter, locationFilter, sortBy]);

  // Get unique providers and locations for filters
  const providers = [...new Set(courses.map(c => c.provider))].sort();
  const locations = [...new Set(courses.map(c => c.location))].sort();

  // Handle Enroll button
  const handleEnroll = useCallback(async (courseId) => {
    if (!currentUser?.id) {
      setToast({ message: "Please log in to enroll in courses", type: "error" });
      return;
    }

    setLoading(prev => ({ ...prev, [`enroll-${courseId}`]: true }));

    try {
      // Optimistic update
      updateEnrolledCourses(courseId, true);

      await enrollInCourse(currentUser.id, courseId);
      setToast({ message: "Enrolled in course successfully!", type: "success" });
      
      // Refresh user data to ensure consistency
      refreshUserData();
    } catch (error) {
      // Rollback optimistic update
      updateEnrolledCourses(courseId, false);
      setToast({ 
        message: error.message || "Failed to enroll. Please try again.", 
        type: "error" 
      });
    } finally {
      setLoading(prev => {
        const newLoading = { ...prev };
        delete newLoading[`enroll-${courseId}`];
        return newLoading;
      });
    }
  }, [currentUser?.id, updateEnrolledCourses, refreshUserData]);

  // Handle Save/Unsave button
  const handleSave = useCallback(async (courseId, shouldSave) => {
    if (!currentUser?.id) {
      setToast({ message: "Please log in to save courses", type: "error" });
      return;
    }

    setLoading(prev => ({ ...prev, [`save-${courseId}`]: true }));

    try {
      // Optimistic update
      updateSavedCourses(courseId, shouldSave);

      if (shouldSave) {
        await saveCourse(currentUser.id, courseId);
        setToast({ message: "Course saved successfully!", type: "success" });
      } else {
        await unsaveCourse(currentUser.id, courseId);
        setToast({ message: "Course unsaved", type: "info" });
      }
      
      // Refresh user data to ensure consistency
      refreshUserData();
    } catch (error) {
      // Rollback optimistic update
      updateSavedCourses(courseId, !shouldSave);
      setToast({ 
        message: error.message || "Failed to save. Please try again.", 
        type: "error" 
      });
    } finally {
      setLoading(prev => {
        const newLoading = { ...prev };
        delete newLoading[`save-${courseId}`];
        return newLoading;
      });
    }
  }, [currentUser?.id, updateSavedCourses, refreshUserData]);

  // Handle Share button
  const handleShare = useCallback(async (courseId) => {
    if (!currentUser?.id) {
      setToast({ message: "Please log in to share courses", type: "error" });
      return;
    }

    setLoading(prev => ({ ...prev, [`share-${courseId}`]: true }));

    try {
      const shareUrl = await shareCourse(currentUser.id, courseId);
      
      // Copy to clipboard
      const copied = await copyToClipboard(shareUrl);
      if (copied) {
        setToast({ message: "Share link copied to clipboard!", type: "success" });
      } else {
        setToast({ message: `Share link: ${shareUrl}`, type: "info" });
      }
    } catch (error) {
      setToast({ 
        message: error.message || "Failed to generate share link. Please try again.", 
        type: "error" 
      });
    } finally {
      setLoading(prev => {
        const newLoading = { ...prev };
        delete newLoading[`share-${courseId}`];
        return newLoading;
      });
    }
  }, [currentUser?.id]);

  if (initialLoading) {
    return (
      <div className="courses-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="courses-container">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header with Search and Filters */}
      <div className="courses-header">
        <div className="courses-header-top">
          <h2>Available Courses</h2>
          <div className="courses-count">
            {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'} found
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="search-filters">
          <div className="search-bar">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search courses, providers, or skills..."
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
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Providers</option>
              {providers.map((provider) => (
                <option key={provider} value={provider}>{provider}</option>
              ))}
            </select>
            
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Locations</option>
              {locations.map((location) => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="title">Sort by: Title</option>
              <option value="provider">Sort by: Provider</option>
              <option value="location">Sort by: Location</option>
            </select>
          </div>
        </div>
      </div>

      {/* Course Cards */}
      <div className="courses-grid">
        {filteredCourses.length === 0 ? (
          <div className="no-results">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <h3>No courses found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredCourses.map((course) => {
            const isSaved = isCourseSaved(course.id);
            const isEnrolled = isCourseEnrolled(course.id);
            const isEnrollLoading = loading[`enroll-${course.id}`];
            const isSaveLoading = loading[`save-${course.id}`];
            const isShareLoading = loading[`share-${course.id}`];
            
            return (
              <div key={course.id} className={`course-card transition-all duration-150 ease-in-out transform hover:scale-102 active:scale-95 active:shadow-md ${isSaved ? 'saved' : ''}`}>
                {/* Course Header */}
                <div className="course-card-header">
                  <div className="course-card-main">
                    <h3 className="course-title">{course.title}</h3>
                    <div className="course-provider">
                      <span className="provider-name">{course.provider}</span>
                    </div>
                    <div className="course-location">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      {course.location}
                    </div>
                  </div>
                </div>

                {/* Course Description */}
                <p className="course-description">{course.description}</p>

                {/* Skills Tags */}
                {course.skills && course.skills.length > 0 && (
                  <div className="course-skills">
                    {course.skills.map((skill, index) => (
                      <span key={index} className="skill-tag">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="course-actions">
                  {isSaved ? (
                    <button
                      className="btn-action saved-btn transition-all duration-150 ease-in-out transform hover:scale-105 active:scale-95 active:shadow-md"
                      onClick={() => handleSave(course.id, false)}
                      disabled={isSaveLoading}
                      aria-label="Unsave course"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                      </svg>
                      {isSaveLoading ? "..." : "Saved"}
                    </button>
                  ) : (
                    <button
                      className="btn-action transition-all duration-150 ease-in-out transform hover:scale-105 active:scale-95 active:shadow-md"
                      onClick={() => handleSave(course.id, true)}
                      disabled={isSaveLoading}
                      aria-label="Save course"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                      </svg>
                      {isSaveLoading ? "..." : "Save"}
                    </button>
                  )}
                  
                  <button 
                    className="btn-action transition-all duration-150 ease-in-out transform hover:scale-105 active:scale-95 active:shadow-md"
                    onClick={() => handleShare(course.id)}
                    disabled={isShareLoading}
                    aria-label="Share course"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                    </svg>
                    {isShareLoading ? "..." : "Share"}
                  </button>
                  
                  {isEnrolled ? (
                    <button
                      className="btn-action primary saved-btn transition-all duration-150 ease-in-out transform hover:scale-105 active:scale-95 active:shadow-md"
                      disabled
                      aria-label="Already enrolled"
                    >
                      Enrolled
                    </button>
                  ) : (
                    <button 
                      className="btn-action primary transition-all duration-150 ease-in-out transform hover:scale-105 active:scale-95 active:shadow-md"
                      onClick={() => handleEnroll(course.id)}
                      disabled={isEnrollLoading}
                      aria-label="Enroll in course"
                    >
                      {isEnrollLoading ? "..." : "Enroll"}
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

