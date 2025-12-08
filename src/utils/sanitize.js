/**
 * Input Sanitization Utilities
 * 
 * Sanitizes user inputs to prevent XSS and data corruption
 */

/**
 * Sanitizes a string by removing potentially dangerous characters
 * @param {string} input - The input string to sanitize
 * @returns {string} - Sanitized string
 */
export const sanitizeString = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove script tags and event handlers
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
};

/**
 * Sanitizes an array of strings
 * @param {Array<string>} input - Array of strings to sanitize
 * @returns {Array<string>} - Sanitized array
 */
export const sanitizeArray = (input) => {
  if (!Array.isArray(input)) return [];
  return input.map(item => sanitizeString(String(item))).filter(Boolean);
};

/**
 * Sanitizes user profile data
 * @param {object} profileData - Profile data object
 * @returns {object} - Sanitized profile data
 */
export const sanitizeProfile = (profileData) => {
  if (!profileData || typeof profileData !== 'object') return {};
  
  return {
    ...profileData,
    full_name: sanitizeString(profileData.full_name || ''),
    email_address: sanitizeString(profileData.email_address || ''),
    education: sanitizeString(profileData.education || ''),
    bio: sanitizeString(profileData.bio || ''),
    custom_interest: sanitizeString(profileData.custom_interest || ''),
    custom_skill: sanitizeString(profileData.custom_skill || ''),
    interests: sanitizeArray(profileData.interests || []),
    skills: sanitizeArray(profileData.skills || []),
  };
};

