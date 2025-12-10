/**
 * Job Service (Firestore Direct)
 *
 * All CRUD operations use Firestore SDK directly - no backend needed!
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
  deleteDoc,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";

/**
 * Apply to a job
 * @param {number|string} userId - The user's ID
 * @param {number|string} jobId - The job's ID
 * @returns {Promise<object>} - Standardized response
 */
export const applyToJob = async (userId, jobId) => {
  try {
    // Convert userId to string for consistency
    const userIdStr = userId.toString();

    // Check if already applied
    const appliedJobsRef = collection(db, "applied_jobs");
    const existingQuery = query(
      appliedJobsRef,
      where("user_id", "==", userIdStr),
      where("career_id", "==", jobId)
    );
    const existingSnapshot = await getDocs(existingQuery);

    if (!existingSnapshot.empty) {
      throw new Error("You have already applied to this job");
    }

    // Create application
    const appRef = await addDoc(appliedJobsRef, {
      user_id: userIdStr,
      career_id: jobId,
      status: "pending",
      applied_at: serverTimestamp(),
    });

    return {
      status: "success",
      message: "Application submitted successfully",
      data: {
        applicationId: appRef.id,
      },
    };
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
    // Convert userId to string for consistency
    const userIdStr = userId.toString();

    // Check if already saved
    const savedCareersRef = collection(db, "saved_careers");
    const existingQuery = query(
      savedCareersRef,
      where("user_id", "==", userIdStr),
      where("career_id", "==", jobId)
    );
    const existingSnapshot = await getDocs(existingQuery);

    if (!existingSnapshot.empty) {
      throw new Error("Job already saved");
    }

    // Save job
    const saveRef = await addDoc(savedCareersRef, {
      user_id: userIdStr,
      career_id: jobId,
      saved_at: serverTimestamp(),
    });

    return {
      status: "success",
      message: "Job saved successfully",
      data: {
        savedId: saveRef.id,
      },
    };
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
    // Convert userId to string for consistency
    const userIdStr = userId.toString();

    const savedCareersRef = collection(db, "saved_careers");
    const querySnapshot = await getDocs(
      query(
        savedCareersRef,
        where("user_id", "==", userIdStr),
        where("career_id", "==", jobId)
      )
    );

    if (querySnapshot.empty) {
      throw new Error("Job not found in saved list");
    }

    // Delete the saved job document
    await deleteDoc(querySnapshot.docs[0].ref);

    return {
      status: "success",
      message: "Job unsaved successfully",
    };
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
    const BASE_URL = window.location.origin;
    const shareToken = crypto.randomUUID().replace(/-/g, "").substring(0, 32);

    // Check if already shared
    const sharedItemsRef = collection(db, "shared_items");
    const existingQuery = query(
      sharedItemsRef,
      where("user_id", "==", userId),
      where("item_type", "==", "job"),
      where("item_id", "==", jobId)
    );
    const existingSnapshot = await getDocs(existingQuery);

    if (!existingSnapshot.empty) {
      const shareDoc = existingSnapshot.docs[0].data();
      const existingUrl = `${BASE_URL}/#/share/job/${shareDoc.share_token}`;
      return existingUrl;
    }

    // Create share
    await addDoc(sharedItemsRef, {
      user_id: userId,
      item_type: "job",
      item_id: jobId,
      share_token: shareToken,
      created_at: serverTimestamp(),
    });

    const shareUrl = `${BASE_URL}/#/share/job/${shareToken}`;
    return shareUrl;
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

    // Convert userId to string for consistency
    const userIdStr = userId.toString();
    console.log("🔍 getUserJobs: Searching for user_id:", userIdStr);

    // Get applied jobs
    // Note: Using where() only (no orderBy) to avoid requiring composite index
    // We'll sort in JavaScript instead
    let appliedQuery = query(
      collection(db, "applied_jobs"),
      where("user_id", "==", userIdStr)
    );

    if (status) {
      appliedQuery = query(appliedQuery, where("status", "==", status));
    }

    const appliedSnapshot = await getDocs(appliedQuery);
    console.log(`📊 Found ${appliedSnapshot.size} applied jobs`);
    const applied = [];

    for (const appliedDoc of appliedSnapshot.docs) {
      const data = appliedDoc.data();
      const careerDoc = await getDoc(
        doc(db, "careers", data.career_id.toString())
      );
      if (careerDoc.exists()) {
        applied.push({
          id: appliedDoc.id,
          career_id: data.career_id,
          status: data.status,
          applied_at: data.applied_at?.toDate()?.toISOString(),
          applied_at_timestamp: data.applied_at?.toDate()?.getTime() || 0, // For sorting
          ...careerDoc.data(),
        });
      }
    }

    // Sort by applied_at descending (most recent first)
    applied.sort(
      (a, b) => (b.applied_at_timestamp || 0) - (a.applied_at_timestamp || 0)
    );

    // Get saved jobs
    // Note: Using where() only (no orderBy) to avoid requiring composite index
    // We'll sort in JavaScript instead
    const savedSnapshot = await getDocs(
      query(collection(db, "saved_careers"), where("user_id", "==", userIdStr))
    );
    console.log(`📊 Found ${savedSnapshot.size} saved jobs`);

    const saved = [];
    for (const savedDoc of savedSnapshot.docs) {
      const data = savedDoc.data();
      const careerDoc = await getDoc(
        doc(db, "careers", data.career_id.toString())
      );
      if (careerDoc.exists()) {
        saved.push({
          id: savedDoc.id,
          career_id: data.career_id,
          saved_at: data.saved_at?.toDate()?.toISOString(),
          saved_at_timestamp: data.saved_at?.toDate()?.getTime() || 0, // For sorting
          ...careerDoc.data(),
        });
      }
    }

    // Sort by saved_at descending (most recent first)
    saved.sort(
      (a, b) => (b.saved_at_timestamp || 0) - (a.saved_at_timestamp || 0)
    );

    return {
      applied,
      saved,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: applied.length,
      },
    };
  } catch (error) {
    console.error("Error getting user jobs:", error);
    throw error;
  }
};
