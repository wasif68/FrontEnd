/**
 * API Configuration
 * Centralized API URL management with environment-based configuration
 */

// Get API URL from environment variable or use default
const getApiUrl = () => {
  // In production, use environment variable or Firebase Functions URL
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // In development, default to localhost
  if (import.meta.env.DEV) {
    return "http://localhost:3100/api";
  }
  
  // Production: Use Firebase Functions URL
  // Format: https://{region}-{project-id}.cloudfunctions.net/api
  return "https://us-central1-system-analysis-edd26.cloudfunctions.net/api";
};

export const API_URL = getApiUrl();

// Validate API URL format
export const validateApiUrl = (url) => {
  try {
    const urlObj = new URL(url);
    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error("Invalid API URL protocol");
    }
    return true;
  } catch (error) {
    console.error("Invalid API URL:", error);
    return false;
  }
};

// Validate API URL on module load
if (!validateApiUrl(API_URL)) {
  console.error("Invalid API URL configuration detected!");
}

