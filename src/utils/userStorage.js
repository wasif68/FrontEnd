/**
 * User Profile Service (Firestore Direct)
 *
 * This file handles updating user profile data using Firestore directly.
 * Supports profilePictures array for album system.
 */

import { getCurrentUser } from "../services/authService";
import { db } from "@/config/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { saveProfile } from "./storage";

/**
 * Loads a user's profile JSON data from the backend or localStorage.
 * @param {string|number} userIdentifier - The ID or name of the user to load.
 * @param {boolean} useId - If true, treats userIdentifier as ID; if false, as name.
 * @returns {Promise<object|null>} - The user's JSON data or null if not found.
 */
export const loadUserJson = async (userIdentifier, useId = false) => {
  try {
    // If useId is true, use ID-based Firestore lookup
    if (
      useId &&
      (typeof userIdentifier === "string" || typeof userIdentifier === "number")
    ) {
      try {
        // Load user from Firestore
        const userDoc = await getDoc(
          doc(db, "users", userIdentifier.toString())
        );
        if (userDoc.exists()) {
          const userData = userDoc.data();

          // Load profile from Firestore
          const profileDoc = await getDoc(
            doc(db, "user_profiles", userIdentifier.toString())
          );
          const profileData = profileDoc.exists()
            ? profileDoc.data()
            : {
                education: null,
                interests: [],
                skills_selected: [],
                completion_percentage: 0,
              };

          // Return combined user data in expected format
          return {
            full_name: userData.name,
            email_address: userData.email,
            gender: userData.gender || "",
            country: userData.country || "",
            year: userData.birthYear || "",
            education: profileData.education || "",
            interests: profileData.interests || [],
            skills: profileData.skills_selected || [],
            bio: profileData.bio || "",
            profile_picture: userData.avatarFile || "",
          };
        }
      } catch (error) {
        console.warn("Error loading from Firestore:", error);
      }

      // Fallback to localStorage
      const currentUser = getCurrentUser();
      if (currentUser && currentUser.name) {
        const localData = localStorage.getItem(`user_json_${currentUser.name}`);
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
    } else {
      // Legacy: Try localStorage with name
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
    console.warn("Error loading user data:", error.message);
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

  // Save to Firestore in background (non-blocking)
  if (currentUser.id) {
    // Don't await - fire and forget
    (async () => {
      try {
        // Update user document
        const userUpdate = {};
        if (profileData.full_name) userUpdate.name = profileData.full_name;
        if (profileData.profile_picture)
          userUpdate.avatarFile = profileData.profile_picture;
        if (profileData.gender) userUpdate.gender = profileData.gender;
        if (profileData.country) userUpdate.country = profileData.country;
        if (profileData.year) userUpdate.birthYear = parseInt(profileData.year);

        if (Object.keys(userUpdate).length > 0) {
          await setDoc(
            doc(db, "users", currentUser.id),
            { ...userUpdate, updatedAt: serverTimestamp() },
            { merge: true }
          );
        }

        // Update user profile
        await setDoc(
          doc(db, "user_profiles", currentUser.id),
          {
            user_id: currentUser.id,
            education: profileData.education || null,
            interests: Array.isArray(profileData.interests)
              ? profileData.interests
              : [],
            skills_selected: Array.isArray(profileData.skills)
              ? profileData.skills
              : [],
            bio: profileData.bio || null,
            recommendations_selected: Array.isArray(
              profileData.recommendations_selected
            )
              ? profileData.recommendations_selected
              : [],
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        console.log("Profile saved to Firestore successfully");
      } catch (error) {
        // Silently fail - already saved to localStorage
        console.warn("Error saving to Firestore:", error.message);
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
