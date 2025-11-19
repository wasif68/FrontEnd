/**
 * Authentication Service
 *
 * This file handles all user authentication logic including:
 * - User login and logout using CSV database
 * - User registration (signup) with CSV storage
 * - Admin user initialization
 * - Session management using localStorage
 *
 * Part of the app: Authentication system
 * Manages: User accounts, login sessions, admin access, CSV integration
 */

import {
  validateLogin,
  addUser,
  findUserByEmail,
  findUserByName,
} from "../utils/csv.js";
import {
  getRandomAvatarFile,
  withAvatarMetadata,
} from "../utils/avatars.js";
import {
  checkUserExists,
  saveUserDataDual,
} from "../utils/userStorage.js";

/**
 * Initialize default admin user
 * Creates an admin account if it doesn't already exist
 */
export const initializeAdminUser = async () => {
  const adminExists = await findUserByEmail("admin");
  if (!adminExists) {
    await addUser({
      name: "Admin",
      email: "admin",
      password: "admin",
      gender: "male",
      year: "1990",
      country: "Bangladesh",
    });
  }
};

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if email format is valid
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Login a user with email and password using CSV database
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<Object>} - { success: boolean, user: Object|null, error: string|null }
 */
export const loginUser = async (email, password) => {
  // Check for admin login
  if (email.toLowerCase() === "admin" && password === "admin") {
    const adminAvatar = getRandomAvatarFile("male");
    const adminUser = {
      email: "admin",
      name: "Admin",
      avatar: adminAvatar,
    };
    const adminWithMeta = withAvatarMetadata(adminUser);
    localStorage.setItem("currentUser", JSON.stringify(adminWithMeta));
    return { success: true, user: adminWithMeta, error: null };
  }

  // Validate login using CSV
  const result = await validateLogin(email, password);

  if (result.success) {
    const userWithAvatar = withAvatarMetadata(result.user);
    
    // Load user JSON data if available
    const { loadUserJson } = await import("../utils/userStorage.js");
    const userName = userWithAvatar.name || userWithAvatar.full_name;
    const userJson = userName ? await loadUserJson(userName) : null;
    
    // Merge JSON data with user object
    const userWithData = {
      ...userWithAvatar,
      ...(userJson && {
        education: userJson.education,
        interests: userJson.interests,
        skills: userJson.skills,
        custom_interest: userJson.custom_interest,
        custom_skill: userJson.custom_skill,
        recommendations_saved: userJson.recommendations_saved,
        recommendations_rejected: userJson.recommendations_rejected,
      }),
    };
    
    // Save current user session
    localStorage.setItem("currentUser", JSON.stringify(userWithData));
    return { ...result, user: userWithData };
  }
  return result;
};

/**
 * Register a new user account with CSV storage
 * @param {string} name - User's full name
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @param {string} confirmPassword - Password confirmation
 * @param {string} gender - User's gender
 * @param {string} year - User's birth year
 * @param {string} country - User's country
 * @returns {Promise<Object>} - { success: boolean, user: Object|null, error: string|null }
 */
export const registerUser = async (
  name,
  email,
  password,
  confirmPassword,
  gender,
  year,
  country
) => {
  // Validation: Check empty fields
  if (
    !name ||
    !email ||
    !password ||
    !confirmPassword ||
    !gender ||
    !year ||
    !country
  ) {
    return { success: false, user: null, error: "Please fill in all fields" };
  }

  // Validation: Check email format
  if (!isValidEmail(email)) {
    return {
      success: false,
      user: null,
      error: "Please enter a valid email address",
    };
  }

  // Validation: Check password match
  if (password !== confirmPassword) {
    return { success: false, user: null, error: "Passwords do not match" };
  }

  // Validation: Check password length
  if (password.length < 6) {
    return {
      success: false,
      user: null,
      error: "Password must be at least 6 characters",
    };
  }

  // Check if name OR email already exists in CSV (signup rule)
  const userExists = await checkUserExists(name, email);
  if (userExists.exists) {
    return {
      success: false,
      user: null,
      error: "Account already exists. Please log in instead.",
    };
  }

  // Get random avatar based on gender
  const avatarFile = getRandomAvatarFile(gender);
  const profilePicture = `Faces/${avatarFile}`;

  // Prepare complete user data for dual storage
  const userData = {
    full_name: name,
    email_address: email,
    password: password,
    gender: gender,
    country: country,
    year: year,
    education: "",
    interests: [],
    custom_interest: "",
    skills: [],
    custom_skill: "",
    profile_picture: profilePicture,
    recommendations_saved: [],
    recommendations_rejected: [],
  };

  // Save to both JSON and CSV (dual storage)
  const saved = await saveUserDataDual(userData);

  if (!saved) {
    return {
      success: false,
      user: null,
      error: "Failed to create account. Please try again.",
    };
  }

  // Auto-login after registration
  const currentUser = withAvatarMetadata({
    email,
    name,
    gender,
    year,
    country,
    avatar: avatarFile,
  });
  localStorage.setItem("currentUser", JSON.stringify(currentUser));

  return { success: true, user: currentUser, error: null };
};

/**
 * Get current logged-in user from localStorage
 * @returns {Object|null} - Current user object or null if not logged in
 */
export const getCurrentUser = () => {
  const currentUser = localStorage.getItem("currentUser");
  return currentUser ? withAvatarMetadata(JSON.parse(currentUser)) : null;
};

/**
 * Logout current user by removing session from localStorage
 */
export const logoutUser = () => {
  localStorage.removeItem("currentUser");
};
