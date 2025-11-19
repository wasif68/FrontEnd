/**
 * Helper Utility Functions
 * 
 * This file contains general-purpose helper functions used throughout the app:
 * - Array operations (finding overlaps, matching)
 * - Data processing and scoring algorithms
 * - Formatting and calculation utilities
 * 
 * Part of the app: Utility functions
 * Manages: Common operations like array matching, scoring, calculations
 */

/**
 * Find overlapping items between two arrays
 * Used for matching user skills/interests with career requirements
 * @param {Array} a - First array
 * @param {Array} b - Second array
 * @returns {Array} - Array of items that exist in both arrays
 */
export const findOverlap = (a = [], b = []) => {
  const setA = new Set(a);
  return b.filter((x) => setA.has(x));
};

/**
 * Calculate profile completion percentage
 * @param {Object} profile - Profile object with name, education, skills, interests
 * @returns {number} - Completion percentage (0-100)
 */
export const calculateProfileCompletion = (profile) => {
  const fields = [
    profile.name,
    profile.education,
    (profile.skills || []).length,
    (profile.interests || []).length,
  ];
  const completedFields = fields.filter(Boolean).length;
  return Math.min((completedFields / 4) * 100, 100);
};

/**
 * Check if a string contains any of the items in an array (case-insensitive)
 * @param {string} text - Text to search in
 * @param {Array} items - Array of items to search for
 * @returns {boolean} - True if any item is found in the text
 */
export const containsAny = (text, items) => {
  const lowerText = text.toLowerCase();
  return items.some((item) =>
    lowerText.includes(item.toLowerCase().split(" ")[0])
  );
};

