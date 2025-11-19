/**
 * Storage Utility Functions
 * 
 * This file provides helper functions for working with localStorage:
 * - Saving and retrieving profile data
 * - Managing saved career items
 * - Generic localStorage operations
 * 
 * Part of the app: Data persistence layer
 * Manages: Local storage operations for profiles, saved items, and user data
 */

// Note: calculateProfileCompletion is in utils/helpers.js, not here

/**
 * Get profile data from localStorage
 * @returns {Object} - Profile object with name, education, interests, skills
 */
export const getProfile = () => {
  return JSON.parse(localStorage.getItem("profile") || "{}");
};

/**
 * Save profile data to localStorage
 * @param {Object} profile - Profile object to save
 */
export const saveProfile = (profile) => {
  localStorage.setItem("profile", JSON.stringify(profile));
};

/**
 * Get saved career items from localStorage
 * @returns {Set} - Set of saved career item IDs
 */
export const getSavedItems = () => {
  return new Set(JSON.parse(localStorage.getItem("saved") || "[]"));
};

/**
 * Save career items to localStorage
 * @param {Set} savedItems - Set of saved career item IDs
 */
export const saveSavedItems = (savedItems) => {
  localStorage.setItem("saved", JSON.stringify(Array.from(savedItems)));
};

/**
 * Generic function to get data from localStorage
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {*} - Stored value or default value
 */
export const getFromStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error);
    return defaultValue;
  }
};

/**
 * Generic function to save data to localStorage
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 */
export const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving to localStorage key "${key}":`, error);
  }
};

