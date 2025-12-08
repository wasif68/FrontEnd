/**
 * Authentication Service (Backend API Only)
 *
 * This file handles user authentication using the backend API.
 * Session management is handled using localStorage.
 */

// The base URL of our backend API
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3100/api";

/**
 * Registers a new user by sending a request to the backend API.
 * @param {object} userData - Contains name, email, and password.
 * @returns {Promise<object>} - The JSON response from the server.
 */
export const registerUser = async (userData) => {
  const { name, email, password } = userData;

  if (!name || !email || !password) {
    throw new Error("Name, email, and password are required.");
  }

  const response = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, email, password }),
  });

  if (!response.ok) {
    let errorMessage = "Failed to register";
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return response.json();
};

/**
 * Logs in a user by authenticating against the backend API.
 * @param {string} email - User's email.
 * @param {string} password - User's password.
 * @returns {Promise<object>} - The user object from the server.
 */
export const loginUser = async (email, password) => {
  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      let errorMessage = "Invalid credentials";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // If response is not JSON, check for network/server errors
        if (response.status === 0 || response.status >= 500) {
          errorMessage = "Server error. Please make sure the backend server is running on port 3100.";
        } else if (response.status === 404) {
          errorMessage = "Login endpoint not found. Please check the backend server.";
        } else {
          errorMessage = `Login failed (${response.status}). Please try again.`;
        }
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (data.user && data.user.id) {
      // Store user data and JWT token
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      if (data.token) {
        localStorage.setItem("authToken", data.token);
      }
      return data.user;
    } else {
      throw new Error("Login failed: Invalid user data received from server.");
    }
  } catch (error) {
    console.error("Login failed:", error);
    // Handle network errors (fetch failures)
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error("Cannot connect to the server. Please make sure the backend server is running on http://localhost:3100");
    }
    throw new Error(
      error.message || "Failed to log in. Please check your credentials."
    );
  }
};

/**
 * Logs out the current user by removing their data from localStorage.
 */
export const logoutUser = () => {
  localStorage.removeItem("currentUser");
  localStorage.removeItem("authToken");
};

/**
 * Gets the current logged-in user from localStorage.
 * @returns {object|null} - The user object or null if not logged in.
 */
export const getCurrentUser = () => {
  const userStr = localStorage.getItem("currentUser");
  if (!userStr) {
    return null;
  }

  try {
    const user = JSON.parse(userStr);
    // Validate that user object has at least email or name (required fields)
    if (user && (user.email || user.name)) {
      return user;
    }
    // Invalid user object, clear it
    localStorage.removeItem("currentUser");
    return null;
  } catch (e) {
    // Invalid JSON, clear it
    localStorage.removeItem("currentUser");
    return null;
  }
};

/**
 * NOTE: The initializeAdminUser function has been removed.
 * Admin user creation should now be handled directly in the database
 * or through a separate, secure admin interface on the backend.
 * Client-side admin initialization is insecure.
 */
