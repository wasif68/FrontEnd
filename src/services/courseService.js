/**
 * Course Service (Firestore Direct)
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
 * Get all courses with optional filtering and pagination
 * @param {object} options - Query options (search, provider, location, limit, page)
 * @returns {Promise<object>} - Object with courses array and pagination info
 */
export const getAllCourses = async (options = {}) => {
  try {
    const { search, provider, location, limit = 20, page = 1 } = options;

    let coursesQuery = collection(db, "courses");

    // Apply filters
    if (provider) {
      coursesQuery = query(
        coursesQuery,
        where("provider", ">=", provider),
        where("provider", "<=", provider + "\uf8ff")
      );
    }

    // Get all courses (Firestore doesn't support offset, so we'll filter client-side for now)
    const snapshot = await getDocs(coursesQuery);

    let courses = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Apply search filter (client-side)
    if (search) {
      const searchLower = search.toLowerCase();
      courses = courses.filter(
        (course) =>
          course.title?.toLowerCase().includes(searchLower) ||
          course.description?.toLowerCase().includes(searchLower) ||
          course.provider?.toLowerCase().includes(searchLower)
      );
    }

    // Apply location filter (client-side)
    if (location) {
      courses = courses.filter((course) =>
        course.location?.toLowerCase().includes(location.toLowerCase())
      );
    }

    // Apply pagination (client-side)
    const startIndex = (page - 1) * limit;
    const paginatedCourses = courses.slice(startIndex, startIndex + limit);

    return {
      courses: paginatedCourses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: courses.length,
      },
    };
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
    // Convert userId to string for consistency
    const userIdStr = userId.toString();

    // Check if already enrolled
    const enrollmentsRef = collection(db, "enrollments");
    const existingQuery = query(
      enrollmentsRef,
      where("user_id", "==", userIdStr),
      where("course_id", "==", courseId)
    );
    const existingSnapshot = await getDocs(existingQuery);

    if (!existingSnapshot.empty) {
      throw new Error("You are already enrolled in this course");
    }

    // Create enrollment
    const enrollmentRef = await addDoc(enrollmentsRef, {
      user_id: userIdStr,
      course_id: courseId,
      status: "in-progress",
      progress: 0,
      enrolled_at: serverTimestamp(),
    });

    return {
      status: "success",
      message: "Enrolled in course successfully",
      data: {
        enrollmentId: enrollmentRef.id,
      },
    };
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
    // Convert userId to string for consistency
    const userIdStr = userId.toString();

    // Check if already saved
    const savedCoursesRef = collection(db, "saved_courses");
    const existingQuery = query(
      savedCoursesRef,
      where("user_id", "==", userIdStr),
      where("course_id", "==", courseId)
    );
    const existingSnapshot = await getDocs(existingQuery);

    if (!existingSnapshot.empty) {
      throw new Error("Course already saved");
    }

    // Save course
    const saveRef = await addDoc(savedCoursesRef, {
      user_id: userIdStr,
      course_id: courseId,
      saved_at: serverTimestamp(),
    });

    return {
      status: "success",
      message: "Course saved successfully",
      data: {
        savedId: saveRef.id,
      },
    };
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
    // Convert userId to string for consistency
    const userIdStr = userId.toString();

    const savedCoursesRef = collection(db, "saved_courses");
    const querySnapshot = await getDocs(
      query(
        savedCoursesRef,
        where("user_id", "==", userIdStr),
        where("course_id", "==", courseId)
      )
    );

    if (querySnapshot.empty) {
      throw new Error("Course not found in saved list");
    }

    // Delete the saved course document
    await deleteDoc(querySnapshot.docs[0].ref);

    return {
      status: "success",
      message: "Course unsaved successfully",
    };
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
    const BASE_URL = window.location.origin;
    const shareToken = crypto.randomUUID().replace(/-/g, "").substring(0, 32);

    // Check if already shared
    const sharedItemsRef = collection(db, "shared_items");
    const existingQuery = query(
      sharedItemsRef,
      where("user_id", "==", userId),
      where("item_type", "==", "course"),
      where("item_id", "==", courseId)
    );
    const existingSnapshot = await getDocs(existingQuery);

    if (!existingSnapshot.empty) {
      const shareDoc = existingSnapshot.docs[0].data();
      const existingUrl = `${BASE_URL}/#/share/course/${shareDoc.share_token}`;
      return existingUrl;
    }

    // Create share
    await addDoc(sharedItemsRef, {
      user_id: userId,
      item_type: "course",
      item_id: courseId,
      share_token: shareToken,
      created_at: serverTimestamp(),
    });

    const shareUrl = `${BASE_URL}/#/share/course/${shareToken}`;
    return shareUrl;
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

    // Convert userId to string for consistency
    const userIdStr = userId.toString();
    console.log("🔍 getUserCourses: Searching for user_id:", userIdStr);

    // Get enrolled courses
    // Note: Using where() only (no orderBy) to avoid requiring composite index
    // We'll sort in JavaScript instead
    let enrolledQuery = query(
      collection(db, "enrollments"),
      where("user_id", "==", userIdStr)
    );

    if (status) {
      enrolledQuery = query(enrolledQuery, where("status", "==", status));
    }

    const enrolledSnapshot = await getDocs(enrolledQuery);
    console.log(`📊 Found ${enrolledSnapshot.size} enrollments`);
    const enrolled = [];

    for (const enrollmentDoc of enrolledSnapshot.docs) {
      const data = enrollmentDoc.data();
      const courseDoc = await getDoc(
        doc(db, "courses", data.course_id.toString())
      );
      if (courseDoc.exists()) {
        enrolled.push({
          id: enrollmentDoc.id,
          course_id: data.course_id,
          status: data.status,
          progress: data.progress,
          enrolled_at: data.enrolled_at?.toDate()?.toISOString(),
          enrolled_at_timestamp: data.enrolled_at?.toDate()?.getTime() || 0, // For sorting
          ...courseDoc.data(),
        });
      }
    }

    // Sort by enrolled_at descending (most recent first)
    enrolled.sort(
      (a, b) => (b.enrolled_at_timestamp || 0) - (a.enrolled_at_timestamp || 0)
    );

    // Get saved courses
    // Note: Using where() only (no orderBy) to avoid requiring composite index
    // We'll sort in JavaScript instead
    const savedSnapshot = await getDocs(
      query(collection(db, "saved_courses"), where("user_id", "==", userIdStr))
    );
    console.log(`📊 Found ${savedSnapshot.size} saved courses`);

    const saved = [];
    for (const savedDoc of savedSnapshot.docs) {
      const data = savedDoc.data();
      const courseDoc = await getDoc(
        doc(db, "courses", data.course_id.toString())
      );
      if (courseDoc.exists()) {
        saved.push({
          id: savedDoc.id,
          course_id: data.course_id,
          saved_at: data.saved_at?.toDate()?.toISOString(),
          saved_at_timestamp: data.saved_at?.toDate()?.getTime() || 0, // For sorting
          ...courseDoc.data(),
        });
      }
    }

    // Sort by saved_at descending (most recent first)
    saved.sort(
      (a, b) => (b.saved_at_timestamp || 0) - (a.saved_at_timestamp || 0)
    );

    return {
      enrolled,
      saved,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: enrolled.length,
      },
    };
  } catch (error) {
    console.error("Error getting user courses:", error);
    throw error;
  }
};
