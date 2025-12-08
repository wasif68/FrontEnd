/**
 * Job Service
 * 
 * Handles all API calls related to job actions (apply, save, share, etc.)
 */

const API_URL = "http://localhost:3100/api";

/**
 * Apply to a job
 * @param {number|string} userId - The user's ID
 * @param {number|string} jobId - The job's ID
 * @returns {Promise<object>} - Standardized response
 */
export const applyToJob = async (userId, jobId) => {
  try {
    const response = await fetch(`${API_URL}/user/${userId}/jobs/${jobId}/apply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || "Failed to apply to job");
    }

    return data;
  } catch (error) {
    console.error("Error applying to job:", error);
    throw error;
  }
};

/**
 * Save a job
 * @param {number|string} userId - The user's ID
 * @param {number|string} jobId - The job's ID
 * @returns {Promise<object>} - Standardized response
 */
export const saveJob = async (userId, jobId) => {
  try {
    const response = await fetch(`${API_URL}/user/${userId}/jobs/${jobId}/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || "Failed to save job");
    }

    return data;
  } catch (error) {
    console.error("Error saving job:", error);
    throw error;
  }
};

/**
 * Unsave a job
 * @param {number|string} userId - The user's ID
 * @param {number|string} jobId - The job's ID
 * @returns {Promise<object>} - Standardized response
 */
export const unsaveJob = async (userId, jobId) => {
  try {
    const response = await fetch(`${API_URL}/user/${userId}/jobs/${jobId}/save`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || "Failed to unsave job");
    }

    return data;
  } catch (error) {
    console.error("Error unsaving job:", error);
    throw error;
  }
};

/**
 * Share a job and get shareable URL
 * @param {number|string} userId - The user's ID
 * @param {number|string} jobId - The job's ID
 * @returns {Promise<string>} - Shareable URL
 */
export const shareJob = async (userId, jobId) => {
  try {
    const response = await fetch(`${API_URL}/user/${userId}/jobs/${jobId}/share`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || "Failed to share job");
    }

    return data.data?.share_url || data.share_url;
  } catch (error) {
    console.error("Error sharing job:", error);
    throw error;
  }
};

/**
 * Get user's applied and saved jobs
 * @param {number|string} userId - The user's ID
 * @param {object} options - Query options (status, limit, page)
 * @returns {Promise<object>} - Object with applied and saved jobs
 */
export const getUserJobs = async (userId, options = {}) => {
  try {
    const { status, limit = 20, page = 1 } = options;
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('limit', limit);
    params.append('page', page);

    const response = await fetch(`${API_URL}/user/${userId}/jobs?${params.toString()}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || "Failed to get user jobs");
    }

    return data.data || data;
  } catch (error) {
    console.error("Error getting user jobs:", error);
    throw error;
  }
};

