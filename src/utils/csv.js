/**
 * CSV Utility Functions
 *
 * This file handles all CSV file operations for user database:
 * - Reading CSV file and parsing user data
 * - Finding users by email address
 * - Adding new users to the database
 * - Validating login credentials
 * - Syncing with localStorage for browser compatibility
 *
 * Part of the app: User database management
 * Manages: CSV file operations, user data storage, authentication data
 */

import {
  getRandomAvatarFile,
  withAvatarMetadata,
} from './avatars.js'

/**
 * Parse CSV text into array of user objects
 * @param {string} csvText - Raw CSV text content
 * @returns {Array} - Array of user objects
 */
const parseCSV = (csvText) => {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  const users = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // Skip empty lines

    const values = lines[i].split(",").map((v) => v.trim());
    const user = {};

    headers.forEach((header, index) => {
      user[header] = values[index] || "";
    });

    // Check if user has email (support both old and new formats)
    if (user.email || user.email_address) {
      // Only add users with valid email
      users.push(user);
    }
  }

  return users;
};

/**
 * Convert array of user objects back to CSV format
 * @param {Array} users - Array of user objects
 * @returns {string} - CSV formatted string
 */
const convertToCSV = (users) => {
  if (users.length === 0)
    return "full_name,email_address,password,gender,country,year,profile_picture,recommendations_selected,bio\n";

  const headers = [
    "full_name",
    "email_address",
    "password",
    "gender",
    "country",
    "year",
    "profile_picture",
    "recommendations_selected",
    "bio",
  ];
  const csvLines = [headers.join(",")];

  users.forEach((user) => {
    const row = headers.map((header) => {
      // Map old field names to new ones for compatibility
      if (header === "full_name") {
        return user.full_name || user.name || "";
      }
      if (header === "email_address") {
        return user.email_address || user.email || "";
      }
      if (header === "profile_picture") {
        return user.profile_picture || user.avatar || "";
      }
      if (header === "recommendations_selected") {
        return user.recommendations_selected || "";
      }
      if (header === "bio") {
        return user.bio || "";
      }
      return user[header] || "";
    }).join(",");
    csvLines.push(row);
  });

  return csvLines.join("\n") + "\n";
};

/**
 * Read all users from CSV file
 * Falls back to localStorage if CSV file cannot be loaded
 * @returns {Promise<Array>} - Array of all users
 */
export const readCSV = async () => {
  try {
    // Try to fetch CSV file - works with both Vite preview and Live Server
    // Try absolute path first (for Vite preview), then relative (for Live Server)
    let response = await fetch("/data/d.csv");
    if (!response.ok) {
      // Fallback to relative path for Live Server
      response = await fetch("./data/d.csv");
      if (!response.ok) {
        throw new Error("CSV file not found");
      }
    }

    const csvText = await response.text();
    const users = parseCSV(csvText);

    // Also sync to localStorage for faster access
    const cachedUsers = JSON.parse(localStorage.getItem("csv_users") || "[]");

    // Merge CSV users with any new users added via signup
    const allUsers = [...users];
    cachedUsers.forEach((cachedUser) => {
      if (!allUsers.find((u) => u.email === cachedUser.email)) {
        allUsers.push(cachedUser);
      }
    });

    const normalizedUsers = allUsers.map((user) => {
      if (user.avatar) return user;
      return { ...user, avatar: getRandomAvatarFile(user.gender) };
    });

    // Update cache
    localStorage.setItem("csv_users", JSON.stringify(normalizedUsers));

    return normalizedUsers;
  } catch (error) {
    console.warn("Could not load CSV file, using localStorage cache:", error);
    // Fallback to localStorage
    return JSON.parse(localStorage.getItem("csv_users") || "[]");
  }
};

/**
 * Find a user by their email address
 * @param {string} email - User's email address
 * @returns {Promise<Object|null>} - User object or null if not found
 */
export const findUserByEmail = async (email) => {
  const users = await readCSV();
  return (
    users.find((user) => 
      (user.email?.toLowerCase() === email.toLowerCase()) ||
      (user.email_address?.toLowerCase() === email.toLowerCase())
    ) || null
  );
};

/**
 * Find a user by their full name
 * @param {string} name - User's full name
 * @returns {Promise<Object|null>} - User object or null if not found
 */
export const findUserByName = async (name) => {
  const users = await readCSV();
  return users.find((user) => 
    (user.name?.toLowerCase() === name.toLowerCase()) ||
    (user.full_name?.toLowerCase() === name.toLowerCase())
  ) || null;
};

/**
 * Add a new user to the database
 * Since browsers can't write files directly, we store in localStorage
 * and provide CSV export functionality
 * @param {Object} userObject - User object with name, email, password, gender, year, country
 * @returns {Promise<boolean>} - True if user was added successfully
 */
export const addUser = async (userObject) => {
  try {
    // Check if user already exists
    const existingUser = await findUserByEmail(userObject.email);
    if (existingUser) {
      return null; // User already exists
    }

    // Get all users
    const users = await readCSV();

    const avatarFile =
      userObject.avatar || getRandomAvatarFile(userObject.gender);

    // Add new user
    const newUser = {
      name: userObject.name,
      email: userObject.email,
      password: userObject.password,
      gender: userObject.gender,
      year: userObject.year,
      country: userObject.country,
      avatar: avatarFile,
    };

    users.push(newUser);

    // Save to localStorage (since we can't write to CSV in browser)
    localStorage.setItem("csv_users", JSON.stringify(users));

    return { ...newUser };
  } catch (error) {
    console.error("Error adding user:", error);
    return null;
  }
};

/**
 * Validate login credentials
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<Object>} - { success: boolean, user: Object|null, error: string|null }
 */
export const validateLogin = async (email, password) => {
  try {
    const user = await findUserByEmail(email);

    if (!user) {
      return {
        success: false,
        user: null,
        error: "Invalid email address or password",
      };
    }

    if (user.password !== password) {
      return {
        success: false,
        user: null,
        error: "Invalid email address or password",
      };
    }

    // Return user without password for security
    const { password: _, ...userWithoutPassword } = user;
    return {
      success: true,
      user: userWithoutPassword,
      error: null,
    };
  } catch (error) {
    console.error("Error validating login:", error);
    return {
      success: false,
      user: null,
      error: "An error occurred during login",
    };
  }
};

/**
 * Download CSV file with all users (for admin/export purposes)
 * @param {Array} users - Array of user objects
 */
export const downloadCSV = (users) => {
  const csvContent = convertToCSV(users);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", "d.csv");
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Get all users as CSV string (for export)
 * @returns {Promise<string>} - CSV formatted string
 */
export const getCSVString = async () => {
  const users = await readCSV();
  return convertToCSV(users);
};
