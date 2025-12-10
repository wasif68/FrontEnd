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
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/config/firebase";
import { getCurrentUser } from "@/services/authService";
import { getUserJobs } from "@/services/jobService";
import { getUserCourses } from "@/services/courseService";

const UserDataContext = createContext();

export function UserDataProvider({ children }) {
  const [user, setUserState] = useState(() => getCurrentUser());
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [enrolledCourses, setEnrolledCourses] = useState(new Set());
  const [savedCourses, setSavedCourses] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to clear all user-related data
  const clearUserData = useCallback(() => {
    setUserState(null);
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

    setUserState(currentUser); // Ensure context's user state is up-to-date

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

  // Real-time listener for user document
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser?.id) {
      setLoading(false);
      clearUserData();
      return;
    }

    console.log("👂 Setting up real-time listener for user:", currentUser.id);

    // Listen for real-time changes to user document
    const unsubscribeUser = onSnapshot(
      doc(db, "users", currentUser.id),
      (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          const updatedUser = {
            id: docSnap.id,
            ...userData,
          };
          console.log("🔄 User data updated from Firestore:", updatedUser);
          setUserState(updatedUser);
        } else {
          console.warn("⚠️ User document not found in Firestore");
        }
      },
      (error) => {
        console.error("❌ Error listening to user document:", error);
        setError(error.message);
      }
    );

    // Also refresh jobs and courses data
    refreshUserData();

    // Cleanup listener on unmount
    return () => {
      unsubscribeUser();
    };
  }, [refreshUserData, clearUserData]);

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
      try {
        console.log(
          "🔄 UserDataContext: Setting user in context:",
          newUser ? { id: newUser.id, email: newUser.email } : null
        );

        // Update user state immediately (synchronous)
        setUserState(newUser);
        console.log("✅ UserDataContext: User state updated");

        if (newUser) {
          // If a new user logs in, trigger a refresh of other data
          // Don't await - let it run in background so it doesn't block navigation
          console.log(
            "🔄 UserDataContext: Triggering background data refresh..."
          );
          refreshUserData().catch((err) => {
            console.error(
              "⚠️ UserDataContext: Error refreshing user data (non-blocking):",
              err
            );
            // Don't throw - allow navigation to proceed even if data refresh fails
          });
        } else {
          // If user is null, clear all data
          clearUserData();
        }
      } catch (error) {
        console.error(
          "❌ UserDataContext: Error in setUser (non-blocking):",
          error
        );
        // Don't throw - this should never block navigation
        // Still try to update user state even if refresh fails
        if (newUser) {
          setUserState(newUser);
        }
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
