/**
 * Authentication Service (Firestore Direct)
 *
 * Handles user authentication using Firestore directly (no backend needed)
 */

import { db } from "@/config/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

/**
 * Simple password hashing using Web Crypto API (browser-compatible)
 * NOTE: For production, consider using Firebase Auth instead
 */
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Verify password against hash
 */
async function verifyPassword(password, hash) {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

/**
 * Registers a new user in Firestore.
 * @param {object} userData - Contains name, email, and password.
 * @returns {Promise<object>} - The user object with ID.
 */
export const registerUser = async (userData) => {
  const { name, email, password } = userData;

  if (!name || !email || !password) {
    throw new Error("Name, email, and password are required.");
  }

  try {
    // Check if user already exists
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      throw new Error("User with this email already exists.");
    }

    // Hash the password (simple SHA-256 hash)
    // NOTE: For production, use Firebase Auth instead of custom password handling
    const hashedPassword = await hashPassword(password);

    // Create user document
    const userRef = doc(collection(db, "users"));
    await setDoc(userRef, {
      name,
      email,
      password: hashedPassword,
      createdAt: serverTimestamp(),
    });

    const userId = userRef.id;

    // Initialize empty user profile
    await setDoc(doc(db, "user_profiles", userId), {
      user_id: userId,
      education: null,
      interests: [],
      skills_selected: [],
      completion_percentage: 0,
    });

    // Return user object (without password)
    // Ensure user object has required fields (email or name) for getCurrentUser() validation
    const user = {
      id: userId,
      name,
      email,
    };

    // Verify user object structure
    if (!user.email && !user.name) {
      throw new Error("User object missing required fields (email or name).");
    }

    // Store in localStorage
    localStorage.setItem("currentUser", JSON.stringify(user));
    console.log("💾 User registered and stored in localStorage:", {
      id: user.id,
      email: user.email,
      name: user.name,
    });

    // Verify storage was successful
    const verifyUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!verifyUser || (!verifyUser.email && !verifyUser.name)) {
      console.error("❌ Failed to verify user storage!");
      throw new Error("Failed to store user session.");
    }
    console.log("✅ User storage verified");

    return user;
  } catch (error) {
    console.error("Registration failed:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    console.error("Full error:", JSON.stringify(error, null, 2));

    // Handle specific Firestore errors
    if (error.code === "permission-denied") {
      throw new Error("Permission denied. Please check Firestore rules.");
    } else if (
      error.code === "unavailable" ||
      error.code === "failed-precondition"
    ) {
      throw new Error(
        "Cannot connect to database. Please check your internet connection and ensure Firestore is enabled."
      );
    } else if (
      error.message?.includes("index") ||
      error.code === "failed-precondition"
    ) {
      throw new Error(
        "Database index required. Please create an index on 'users.email' in Firebase Console."
      );
    } else if (error.code === "already-exists") {
      throw new Error("User with this email already exists.");
    }

    throw new Error(error.message || "Failed to register. Please try again.");
  }
};

/**
 * Logs in a user by authenticating against Firestore.
 * @param {string} email - User's email.
 * @param {string} password - User's password.
 * @returns {Promise<object>} - The user object.
 */
export const loginUser = async (email, password) => {
  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  try {
    // Find user by email
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Invalid credentials.");
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    // Check if password field exists
    if (!userData.password) {
      throw new Error("Invalid credentials.");
    }

    // Verify password
    const isMatch = await verifyPassword(password, userData.password);
    if (!isMatch) {
      throw new Error("Invalid credentials.");
    }

    // Don't send password back
    const user = {
      id: userDoc.id,
      name: userData.name,
      email: userData.email,
      gender: userData.gender || null,
      birthYear: userData.birthYear || null,
      country: userData.country || null,
      avatarFile: userData.avatarFile || null,
    };

    // Verify user object has required fields (email or name) for getCurrentUser() validation
    if (!user.email && !user.name) {
      throw new Error("User object missing required fields (email or name).");
    }

    // Store user data in localStorage
    localStorage.setItem("currentUser", JSON.stringify(user));
    console.log("💾 User stored in localStorage:", {
      id: user.id,
      email: user.email,
      name: user.name,
    });

    // Verify storage was successful
    const verifyUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!verifyUser || (!verifyUser.email && !verifyUser.name)) {
      console.error("❌ Failed to verify user storage!");
      throw new Error("Failed to store user session.");
    }
    console.log("✅ User storage verified");

    return user;
  } catch (error) {
    console.error("Login failed:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    console.error("Full error:", JSON.stringify(error, null, 2));

    // Handle specific Firestore errors
    if (error.code === "permission-denied") {
      throw new Error("Permission denied. Please check Firestore rules.");
    } else if (
      error.code === "unavailable" ||
      error.code === "failed-precondition"
    ) {
      throw new Error(
        "Cannot connect to database. Please check your internet connection and ensure Firestore is enabled."
      );
    } else if (
      error.message?.includes("index") ||
      error.code === "failed-precondition"
    ) {
      throw new Error(
        "Database index required. Please create an index on 'users.email' in Firebase Console."
      );
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
