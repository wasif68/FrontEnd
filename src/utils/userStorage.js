/**
 * User Storage Service - Dual Storage System
 *
 * This file handles dual storage for user data:
 * - Stores full user profile in JSON files (/user/{name}.json)
 * - Keeps CSV file (d.csv) synchronized with essential fields
 * - Both storage locations are updated together whenever user data changes
 *
 * Part of the app: User data management
 * Manages: JSON file storage, CSV synchronization, dual storage updates
 */

import { readCSV, findUserByEmail, findUserByName } from "./csv.js";
import { getRandomAvatarFile, getAvatarUrl } from "./avatars.js";

/**
 * Get sanitized filename from user name
 * @param {string} name - User's full name
 * @returns {string} - Sanitized filename
 */
const getFileName = (name) => {
  return name
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/\s+/g, "_")
    .toLowerCase();
};

/**
 * Get user JSON file path
 * @param {string} name - User's full name
 * @returns {string} - JSON file path
 */
const getUserJsonPath = (name) => {
  const fileName = getFileName(name);
  return `/user/${fileName}.json`;
};

/**
 * Save user JSON file to localStorage (simulating file system)
 * In production, this would be handled by a backend API
 * @param {string} name - User's full name
 * @param {Object} userData - Complete user profile data
 * @param {string} oldName - Previous name (for renaming)
 * @returns {Promise<boolean>} - True if saved successfully
 */
export const saveUserJson = async (name, userData, oldName = null) => {
  try {
    const fileName = getFileName(name);
    const jsonData = JSON.stringify(userData, null, 2);

    // If name changed, delete old JSON file
    if (oldName && oldName !== name) {
      const oldFileName = getFileName(oldName);
      localStorage.removeItem(`user_json_${oldFileName}`);

      // Update user files mapping
      const userFiles = JSON.parse(localStorage.getItem("user_files") || "{}");
      delete userFiles[oldName];
      localStorage.setItem("user_files", JSON.stringify(userFiles));
    }

    // Store in localStorage (key: user_json_{filename})
    localStorage.setItem(`user_json_${fileName}`, jsonData);

    // Also store the mapping (name -> filename)
    const userFiles = JSON.parse(localStorage.getItem("user_files") || "{}");
    userFiles[name] = fileName;
    localStorage.setItem("user_files", JSON.stringify(userFiles));

    return true;
  } catch (error) {
    console.error("Error saving user JSON:", error);
    return false;
  }
};

/**
 * Load user JSON file from localStorage
 * @param {string} name - User's full name
 * @returns {Promise<Object|null>} - User data or null if not found
 */
export const loadUserJson = async (name) => {
  try {
    const fileName = getFileName(name);
    const jsonData = localStorage.getItem(`user_json_${fileName}`);

    if (!jsonData) {
      return null;
    }

    return JSON.parse(jsonData);
  } catch (error) {
    console.error("Error loading user JSON:", error);
    return null;
  }
};

/**
 * Delete old profile picture from localStorage (simulated file system)
 * @param {string} imagePath - Path to the old image
 */
const deleteOldImage = (imagePath) => {
  if (!imagePath) return;

  try {
    // Store list of deleted images in localStorage
    const deletedImages = JSON.parse(
      localStorage.getItem("deleted_images") || "[]"
    );
    if (!deletedImages.includes(imagePath)) {
      deletedImages.push(imagePath);
      localStorage.setItem("deleted_images", JSON.stringify(deletedImages));
    }
  } catch (error) {
    console.error("Error tracking deleted image:", error);
  }
};

/**
 * Update CSV row for existing user (complete overwrite, no merging)
 * @param {string} email - User's email (used to find the row)
 * @param {Object} updatedData - Updated user data (completely replaces old data)
 * @param {string} oldImagePath - Previous profile picture path (to delete)
 * @returns {Promise<boolean>} - True if updated successfully
 */
const updateCSVRow = async (email, updatedData, oldImagePath = null) => {
  try {
    const users = await readCSV();
    const userIndex = users.findIndex(
      (u) =>
        u.email?.toLowerCase() === email.toLowerCase() ||
        u.email_address?.toLowerCase() === email.toLowerCase()
    );

    if (userIndex === -1) {
      return false;
    }

    // Delete old image if it changed
    if (oldImagePath && oldImagePath !== updatedData.profile_picture) {
      deleteOldImage(oldImagePath);
    }

    // COMPLETE OVERWRITE - Replace entire row with new data (no merging)
    users[userIndex] = {
      full_name: updatedData.full_name || "",
      email_address: updatedData.email_address || "",
      password: updatedData.password || "",
      gender: updatedData.gender || "",
      country: updatedData.country || "",
      year: updatedData.year || "",
      profile_picture: updatedData.profile_picture || "",
      recommendations_selected: updatedData.recommendations_selected || "",
      bio: updatedData.bio || "",
    };

    // Save to localStorage
    localStorage.setItem("csv_users", JSON.stringify(users));

    return true;
  } catch (error) {
    console.error("Error updating CSV row:", error);
    return false;
  }
};

/**
 * Save user data to both JSON and CSV (synchronized) - COMPLETE OVERWRITE
 * @param {Object} userData - Complete user profile data (completely replaces old data)
 * @param {string} oldName - Previous name (for renaming JSON file)
 * @param {string} oldImagePath - Previous profile picture path (to delete)
 * @returns {Promise<boolean>} - True if both saved successfully
 */
export const saveUserDataDual = async (
  userData,
  oldName = null,
  oldImagePath = null
) => {
  try {
    const fullName = userData.full_name || userData.name;
    const email = userData.email_address || userData.email;

    if (!fullName || !email) {
      console.error("Missing required fields: name or email");
      return false;
    }

    // COMPLETE OVERWRITE - Prepare JSON data (no merging, completely replace)
    const jsonData = {
      full_name: fullName,
      email_address: email,
      password: userData.password || "",
      gender: userData.gender || "",
      country: userData.country || "",
      year: userData.year || "",
      education: userData.education || "",
      interests: userData.interests || [], // Complete replacement, no merging
      custom_interest: userData.custom_interest || "",
      skills: userData.skills || [], // Complete replacement, no merging
      custom_skill: userData.custom_skill || "",
      profile_picture: userData.profile_picture || "",
      bio: userData.bio || "",
      recommendations_saved: userData.recommendations_saved || [],
      recommendations_selected: userData.recommendations_selected || [],
      recommendations_rejected: userData.recommendations_rejected || [],
    };

    // Save JSON file (with name change handling)
    const jsonSaved = await saveUserJson(fullName, jsonData, oldName);

    // Prepare CSV data (essential fields only) - COMPLETE OVERWRITE
    const csvData = {
      full_name: fullName,
      email_address: email,
      password: userData.password || "",
      gender: userData.gender || "",
      country: userData.country || "",
      year: userData.year || "",
      profile_picture: userData.profile_picture || "",
      recommendations_selected: Array.isArray(userData.recommendations_selected)
        ? userData.recommendations_selected.join("; ")
        : userData.recommendations_selected || "",
      bio: userData.bio || "",
    };

    // Check if user exists in CSV (by email)
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      // Update existing CSV row (complete overwrite)
      await updateCSVRow(email, csvData, oldImagePath);
    } else {
      // Add new user to CSV with new format
      const users = await readCSV();
      users.push(csvData);
      localStorage.setItem("csv_users", JSON.stringify(users));
    }

    return jsonSaved;
  } catch (error) {
    console.error("Error saving user data (dual storage):", error);
    return false;
  }
};

/**
 * Load user data from JSON file
 * @param {string} name - User's full name
 * @returns {Promise<Object|null>} - User data or null
 */
export const loadUserData = async (name) => {
  return await loadUserJson(name);
};

/**
 * Check if user exists by name or email
 * @param {string} name - User's full name
 * @param {string} email - User's email address
 * @returns {Promise<Object>} - { exists: boolean, byName: boolean, byEmail: boolean }
 */
export const checkUserExists = async (name, email) => {
  const byName = await findUserByName(name);
  const byEmail = await findUserByEmail(email);

  return {
    exists: !!(byName || byEmail),
    byName: !!byName,
    byEmail: !!byEmail,
  };
};

/**
 * Download user JSON file (for export/backup)
 * @param {string} name - User's full name
 * @param {Object} userData - User data to download
 */
export const downloadUserJson = (name, userData) => {
  const fileName = getFileName(name);
  const jsonContent = JSON.stringify(userData, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${fileName}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Get all user JSON files (for admin/export)
 * @returns {Promise<Array>} - Array of user data objects
 */
export const getAllUserJsonFiles = async () => {
  try {
    const userFiles = JSON.parse(localStorage.getItem("user_files") || "{}");
    const allUsers = [];

    for (const [name, fileName] of Object.entries(userFiles)) {
      const userData = await loadUserJson(name);
      if (userData) {
        allUsers.push(userData);
      }
    }

    return allUsers;
  } catch (error) {
    console.error("Error getting all user JSON files:", error);
    return [];
  }
};
