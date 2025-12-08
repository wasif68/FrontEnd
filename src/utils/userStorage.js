/**
 * User Profile Service (Enhanced with localStorage fallback)
 *
 * This file handles updating user profile data with backend API and localStorage fallback.
 * Supports profilePictures array for album system.
 */

import { getCurrentUser } from "../services/authService";
import { saveProfile } from "./storage";

const API_URL = "http://localhost:3100/api";

/**
 * Loads a user's profile JSON data from the backend or localStorage.
 * @param {string|number} userIdentifier - The ID or name of the user to load.
 * @param {boolean} useId - If true, treats userIdentifier as ID; if false, as name.
 * @returns {Promise<object|null>} - The user's JSON data or null if not found.
 */
export const loadUserJson = async (userIdentifier, useId = false) => {
  try {
    // If useId is true, use ID-based endpoint; otherwise use name-based localStorage
    if (useId && typeof userIdentifier === "number") {
      // Try backend first with ID
      const response = await fetch(`${API_URL}/user/${userIdentifier}/profile`);
      if (response.ok) {
        return await response.json();
      }
      if (response.status === 404) {
        // Try localStorage fallback with name (if we have it)
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.name) {
          const localData = localStorage.getItem(
            `user_json_${currentUser.name}`
          );
          if (localData) {
            try {
              return JSON.parse(localData);
            } catch (e) {
              console.error("Error parsing user JSON from localStorage:", e);
              return null;
            }
          }
        }
        return null;
      }
      throw new Error(`Failed to load user profile: ${response.statusText}`);
    } else {
      // Legacy: Try backend with name (may not work if backend expects ID)
      // Try localStorage fallback
      const localData = localStorage.getItem(`user_json_${userIdentifier}`);
      if (localData) {
        try {
          return JSON.parse(localData);
        } catch (e) {
          console.error("Error parsing user JSON from localStorage:", e);
          return null;
        }
      }
      return null;
    }
  } catch (error) {
    console.warn("Backend not available, using localStorage:", error.message);
    // Fallback to localStorage
    const currentUser = getCurrentUser();
    const name =
      typeof userIdentifier === "string"
        ? userIdentifier
        : currentUser?.name || "";
    if (name) {
      const localData = localStorage.getItem(`user_json_${name}`);
      if (localData) {
        try {
          return JSON.parse(localData);
        } catch (e) {
          console.error("Error parsing user JSON from localStorage:", e);
          return null;
        }
      }
    }
    return null;
  }
};

/**
 * Updates the user's profile on the backend or localStorage.
 * @param {object} profileData - The profile data to save.
 * @param {string} oldName - Previous name if name changed (for renaming storage key).
 * @param {string} oldImagePath - Previous image path if image changed.
 * @returns {Promise<object>} - The JSON response from the server or success object.
 */
export const updateUserProfile = async (
  profileData,
  oldName = null,
  oldImagePath = null
) => {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error("No user is currently logged in.");
  }

  const userName = profileData.full_name || currentUser.name;
  const storageKey = `user_json_${userName}`;

  // Always save to localStorage first (immediate save)
  try {
      localStorage.setItem(storageKey, JSON.stringify(profileData));
      
      // If name changed, remove old storage
      if (oldName && oldName !== userName) {
        localStorage.removeItem(`user_json_${oldName}`);
      }
      
    // Update currentUser in localStorage
      const updatedUser = {
        ...currentUser,
        name: userName,
      avatar:
        profileData.profile_picture?.replace("Faces/", "") ||
        currentUser.avatar,
        avatarFile: profileData.profile_picture || currentUser.avatarFile,
      };
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
  } catch (error) {
    console.error("Error saving to localStorage:", error);
    throw new Error("Failed to save profile to local storage");
  }

  // Try backend in background (completely fire-and-forget, non-blocking)
  if (currentUser.id && API_URL) {
    // Don't await - fire and forget
    (async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 500); // Very short timeout

        const response = await fetch(
          `${API_URL}/user/${currentUser.id}/profile`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(profileData),
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          console.log("Profile saved to backend successfully");
        }
      } catch (error) {
        // Silently fail - already saved to localStorage
        // Don't log abort errors
        if (error.name !== "AbortError") {
          console.warn(
            "Backend not available, using localStorage only:",
            error.message
          );
        }
      }
    })();
  }

  // Return success immediately (already saved to localStorage)
  return { success: true, message: "Profile saved to local storage" };
};

/**
 * Saves user data to both the backend and localStorage.
 * Complete overwrite - replaces all previous data for the user.
 * @param {object} profileData - The complete profile data to save.
 * @param {string} oldName - Previous name if name changed.
 * @param {string} oldImagePath - Previous image path if image changed.
 * @returns {Promise<object>} - The JSON response from the server or success object.
 */
export const saveUserDataDual = async (
  profileData,
  oldName = null,
  oldImagePath = null
) => {
  // Ensure profilePictures array exists
  if (!profileData.profilePictures) {
    profileData.profilePictures = [];
  }

  // If profile_picture is set, ensure it's in profilePictures array
  if (profileData.profile_picture) {
    const existingIndex = profileData.profilePictures.findIndex(
      (pic) => pic.path === profileData.profile_picture
    );
    
    // Mark all as not profile
    profileData.profilePictures.forEach((pic) => {
      pic.isProfile = false;
    });

    if (existingIndex >= 0) {
      // Update existing
      profileData.profilePictures[existingIndex].isProfile = true;
    } else {
      // Add new
      profileData.profilePictures.push({
        path: profileData.profile_picture,
        isProfile: true,
      });
    }
  }

  // Complete overwrite - save all data (never store password)
  const completeData = {
    full_name: profileData.full_name || "",
    email_address: profileData.email_address || "",
    // Password removed - never store passwords in localStorage
    gender: profileData.gender || "",
    country: profileData.country || "",
    year: profileData.year || "",
    education: profileData.education || "",
    interests: profileData.interests || [],
    custom_interest: profileData.custom_interest || "",
    skills: profileData.skills || [],
    custom_skill: profileData.custom_skill || "",
    profile_picture: profileData.profile_picture || "",
    profilePictures: profileData.profilePictures || [],
    bio: profileData.bio || "",
    recommendations_saved: profileData.recommendations_saved || [],
    recommendations_selected: profileData.recommendations_selected || [],
    recommendations_rejected: profileData.recommendations_rejected || [],
  };

  // Save to backend/localStorage (non-blocking)
  try {
  const result = await updateUserProfile(completeData, oldName, oldImagePath);
  
  // Also save to generic profile storage for compatibility
    try {
  saveProfile(completeData);
    } catch (error) {
      console.warn("Error saving to generic profile storage:", error);
      // Continue - main save already succeeded
    }
  
  return result;
  } catch (error) {
    console.error("Error in updateUserProfile:", error);
    // Still try to save to generic profile storage
    try {
      saveProfile(completeData);
    } catch (e) {
      // Ignore
    }
    // Return error but don't throw - let UI handle it
    return {
      success: false,
      message: error.message || "Failed to save profile",
    };
  }
};
