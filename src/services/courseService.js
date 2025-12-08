/**
 * Course Service
 * 
 * Handles all API calls related to course actions (enroll, save, share, etc.)
 */

const API_URL = "http://localhost:3100/api";

/**
 * Get all courses with optional filtering and pagination
 * @param {object} options - Query options (search, provider, location, limit, page)
 * @returns {Promise<object>} - Object with courses array and pagination info
 */
export const getAllCourses = async (options = {}) => {
  try {
    const { search, provider, location, limit = 20, page = 1 } = options;
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (provider) params.append('provider', provider);
    if (location) params.append('location', location);
    params.append('limit', limit);
    params.append('page', page);

    const response = await fetch(`${API_URL}/courses?${params.toString()}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || "Failed to get courses");
    }

    return data.data || data;
  } catch (error) {
    console.error("Error getting courses:", error);
    throw error;
  }
};

/**
 * Enroll in a course
 * @param {number|string} userId - The user's ID
 * @param {number|string} courseId - The course's ID
 * @returns {Promise<object>} - Standardized response
 */
export const enrollInCourse = async (userId, courseId) => {
  try {
    const response = await fetch(`${API_URL}/user/${userId}/courses/${courseId}/enroll`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || "Failed to enroll in course");
    }

    return data;
  } catch (error) {
    console.error("Error enrolling in course:", error);
    throw error;
  }
};

/**
 * Save a course
 * @param {number|string} userId - The user's ID
 * @param {number|string} courseId - The course's ID
 * @returns {Promise<object>} - Standardized response
 */
export const saveCourse = async (userId, courseId) => {
  try {
    const response = await fetch(`${API_URL}/user/${userId}/courses/${courseId}/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || "Failed to save course");
    }

    return data;
  } catch (error) {
    console.error("Error saving course:", error);
    throw error;
  }
};

/**
 * Unsave a course
 * @param {number|string} userId - The user's ID
 * @param {number|string} courseId - The course's ID
 * @returns {Promise<object>} - Standardized response
 */
export const unsaveCourse = async (userId, courseId) => {
  try {
    const response = await fetch(`${API_URL}/user/${userId}/courses/${courseId}/save`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || "Failed to unsave course");
    }

    return data;
  } catch (error) {
    console.error("Error unsaving course:", error);
    throw error;
  }
};

/**
 * Share a course and get shareable URL
 * @param {number|string} userId - The user's ID
 * @param {number|string} courseId - The course's ID
 * @returns {Promise<string>} - Shareable URL
 */
export const shareCourse = async (userId, courseId) => {
  try {
    const response = await fetch(`${API_URL}/user/${userId}/courses/${courseId}/share`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || "Failed to share course");
    }

    return data.data?.share_url || data.share_url;
  } catch (error) {
    console.error("Error sharing course:", error);
    throw error;
  }
};

/**
 * Get user's enrolled and saved courses
 * @param {number|string} userId - The user's ID
 * @param {object} options - Query options (status, limit, page)
 * @returns {Promise<object>} - Object with enrolled and saved courses
 */
export const getUserCourses = async (userId, options = {}) => {
  try {
    const { status, limit = 20, page = 1 } = options;
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('limit', limit);
    params.append('page', page);

    const response = await fetch(`${API_URL}/user/${userId}/courses?${params.toString()}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || "Failed to get user courses");
    }

    return data.data || data;
  } catch (error) {
    console.error("Error getting user courses:", error);
    throw error;
  }
};

