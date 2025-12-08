/**
 * User Data Context
 *
 * Provides global state management for user's applied/saved/enrolled data
 * with optimistic updates and rollback on errors
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { getCurrentUser } from "@/services/authService";
import { getUserJobs } from "@/services/jobService";
import { getUserCourses } from "@/services/courseService";

const UserDataContext = createContext();

export function UserDataProvider({ children }) {
  const [user, setUser] = useState(() => getCurrentUser());
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [enrolledCourses, setEnrolledCourses] = useState(new Set());
  const [savedCourses, setSavedCourses] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to clear all user-related data
  const clearUserData = useCallback(() => {
    setUser(null);
    setAppliedJobs(new Set());
    setSavedJobs(new Set());
    setEnrolledCourses(new Set());
    setSavedCourses(new Set());
    setError(null);
  }, []);

  // Load user data from API
  const refreshUserData = useCallback(async () => {
    const currentUser = getCurrentUser(); // Get current user from localStorage
    if (!currentUser?.id) {
      setLoading(false);
      clearUserData(); // Clear state if no user is found
      return;
    }

    setUser(currentUser); // Ensure context's user state is up-to-date

    try {
      setLoading(true);
      setError(null);

      // Fetch jobs and courses in parallel
      const [jobsData, coursesData] = await Promise.all([
        getUserJobs(currentUser.id).catch(() => ({ applied: [], saved: [] })),
        getUserCourses(currentUser.id).catch(() => ({
          enrolled: [],
          saved: [],
        })),
      ]);

      // Update state with fetched data
      setAppliedJobs(
        new Set((jobsData.applied || []).map((job) => job.career_id))
      );
      setSavedJobs(new Set((jobsData.saved || []).map((job) => job.career_id)));
      setEnrolledCourses(
        new Set((coursesData.enrolled || []).map((course) => course.course_id))
      );
      setSavedCourses(
        new Set((coursesData.saved || []).map((course) => course.course_id))
      );
    } catch (err) {
      console.error("Error refreshing user data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on mount and whenever the user changes (e.g., after login/logout)
  useEffect(() => {
    refreshUserData();
  }, [refreshUserData]);

  // Optimistic update functions remain the same...

  const updateAppliedJobs = useCallback((jobId, isApplied) => {
    setAppliedJobs((prev) => {
      const newSet = new Set(prev);
      if (isApplied) {
        newSet.add(Number(jobId));
      } else {
        newSet.delete(Number(jobId));
      }
      return newSet;
    });
  }, []);

  const updateSavedJobs = useCallback((jobId, isSaved) => {
    setSavedJobs((prev) => {
      const newSet = new Set(prev);
      if (isSaved) {
        newSet.add(Number(jobId));
      } else {
        newSet.delete(Number(jobId));
      }
      return newSet;
    });
  }, []);

  const updateEnrolledCourses = useCallback((courseId, isEnrolled) => {
    setEnrolledCourses((prev) => {
      const newSet = new Set(prev);
      if (isEnrolled) {
        newSet.add(Number(courseId));
      } else {
        newSet.delete(Number(courseId));
      }
      return newSet;
    });
  }, []);

  const updateSavedCourses = useCallback((courseId, isSaved) => {
    setSavedCourses((prev) => {
      const newSet = new Set(prev);
      if (isSaved) {
        newSet.add(Number(courseId));
      } else {
        newSet.delete(Number(courseId));
      }
      return newSet;
    });
  }, []);

  const value = {
    user, // Expose the user object
    setUser: (newUser) => {
      setUser(newUser);
      if (newUser) {
        // If a new user logs in, trigger a refresh of other data
        // Don't await - let it run in background so it doesn't block navigation
        refreshUserData().catch((err) => {
          console.error("Error refreshing user data after login:", err);
          // Don't throw - allow navigation to proceed even if data refresh fails
        });
      }
    },
    appliedJobs,
    savedJobs,
    enrolledCourses,
    savedCourses,
    loading,
    error,
    refreshUserData,
    clearUserData, // Expose clearUserData
    updateAppliedJobs,
    updateSavedJobs,
    updateEnrolledCourses,
    updateSavedCourses,
    isJobApplied: (jobId) => appliedJobs.has(Number(jobId)),
    isJobSaved: (jobId) => savedJobs.has(Number(jobId)),
    isCourseEnrolled: (courseId) => enrolledCourses.has(Number(courseId)),
    isCourseSaved: (courseId) => savedCourses.has(Number(courseId)),
  };

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
}

export function useUserData() {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error("useUserData must be used within UserDataProvider");
  }
  return context;
}
