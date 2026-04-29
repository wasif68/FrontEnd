/**
 * Firebase Cloud Functions
 * 
 * Express API server deployed as Firebase Function
 * Uses Firestore instead of SQLite
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

admin.initializeApp();

const app = express();

// CORS configuration - allow your Firebase Hosting domain
const corsOptions = {
  origin: [
    "https://system-analysis-edd26.web.app",
    "https://system-analysis-edd26.firebaseapp.com",
    "http://localhost:5173", // For local development
    "http://localhost:3000",
  ],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Standardized response helper
const sendResponse = (res, status, message, data = null, error = null) => {
  const response = { status, message };
  if (data !== null) response.data = data;
  if (error !== null) response.error = error;
  return res.status(status === "success" ? 200 : status).json(response);
};

// Get Firestore reference
const db = admin.firestore();

// --- API ROUTES ---

// Test route
app.get("/", (req, res) => {
  res.send("Hello from the CareerAI backend!");
});

// Get All Careers Route
app.get("/api/careers", async (req, res) => {
  try {
    const careersSnapshot = await db.collection("careers").get();
    const careers = careersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      skills: doc.data().skills || [],
    }));
    res.status(200).json(careers);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err.message });
  }
});

// Get Profile Fields Route
app.get("/api/profile-fields", async (req, res) => {
  try {
    const fieldsDoc = await db.collection("config").doc("profile_fields").get();
    if (fieldsDoc.exists()) {
      res.status(200).json(fieldsDoc.data());
    } else {
      // Return default structure if not found
      res.status(200).json({
        education: ["HSC", "Diploma", "BSc"],
        interests: [],
        skills: [],
      });
    }
  } catch (err) {
    res.status(500).json({
      message: "Error reading profile fields",
      error: err.message,
    });
  }
  return null;
});

// User Registration Route
app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide name, email, and password." });
  }

  try {
    // Check if user already exists
    const userSnapshot = await db
      .collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (!userSnapshot.empty) {
      return res
        .status(400)
        .json({ message: "User with this email already exists." });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user document
    const userRef = db.collection("users").doc();
    await userRef.set({
      name,
      email,
      password: hashedPassword,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const userId = userRef.id;

    // Initialize empty user profile
    await db.collection("user_profiles").doc(userId).set({
      user_id: userId,
      education: null,
      interests: [],
      skills_selected: [],
      completion_percentage: 0,
    });

    res.status(201).json({
      message: "User registered successfully",
      userId: userId,
    });
  } catch (err) {
    res.status(500).json({
      message: "Database error on user creation",
      error: err.message,
    });
  }
});

// User Login Route
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide email and password." });
  }

  try {
    // Find user by email
    const userSnapshot = await db
      .collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const userDoc = userSnapshot.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() };

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    // Don't send password back
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      message: "Login successful",
      user: userWithoutPassword,
    });
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err.message });
  }
  return null;
});

// Get User Profile Route
app.get("/api/user/:id/profile", async (req, res) => {
  const { id } = req.params;

  try {
    const userDoc = await db.collection("users").doc(id).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = { id: userDoc.id, ...userDoc.data() };
    const profileDoc = await db.collection("user_profiles").doc(id).get();

    const profile = profileDoc.exists
      ? profileDoc.data()
      : {
          education: null,
          interests: [],
          skills_selected: [],
          completion_percentage: 0,
        };

    res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      gender: user.gender || null,
      birthYear: user.birthYear || null,
      country: user.country || null,
      avatarFile: user.avatarFile || null,
      education: profile.education,
      interests: JSON.stringify(profile.interests || []),
      skills_selected: JSON.stringify(profile.skills_selected || []),
      completion_percentage: profile.completion_percentage || 0,
    });
    return null;
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err.message });
    return null;
  }
});

// Update User Profile Route
app.put("/api/user/:id/profile", async (req, res) => {
  const { id } = req.params;
  const { name, education, interests, skills_selected, avatarFile } = req.body;

  try {
    // Update user document
    const userUpdate = {};
    if (name) userUpdate.name = name;
    if (avatarFile) userUpdate.avatarFile = avatarFile;

    if (Object.keys(userUpdate).length > 0) {
      await db.collection("users").doc(id).update(userUpdate);
    }

    // Update or create profile
    await db.collection("user_profiles").doc(id).set(
      {
        user_id: id,
        education: education || null,
        interests: Array.isArray(interests) ? interests : [],
        skills_selected: Array.isArray(skills_selected) ? skills_selected : [],
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    res.status(200).json({ message: "Profile updated successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error updating profile",
      error: err.message,
    });
  }
});

// Apply to a job
app.post("/api/user/:id/jobs/:jobId/apply", async (req, res) => {
  const { id, jobId } = req.params;

  try {
    // Check if already applied
    const existing = await db
      .collection("applied_jobs")
      .where("user_id", "==", id)
      .where("career_id", "==", jobId)
      .limit(1)
      .get();

    if (!existing.empty) {
      return sendResponse(res, 400, "You have already applied to this job");
    }

    // Create application
    const appRef = await db.collection("applied_jobs").add({
      user_id: id,
      career_id: jobId,
      status: "pending",
      applied_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    sendResponse(res, "success", "Application submitted successfully", {
      applicationId: appRef.id,
    });
    return null;
  } catch (err) {
    sendResponse(res, 500, "Error applying to job", null, err.message);
    return null;
  }
});

// Save a job
app.post("/api/user/:id/jobs/:jobId/save", async (req, res) => {
  const { id, jobId } = req.params;

  try {
    // Check if already saved
    const existing = await db
      .collection("saved_careers")
      .where("user_id", "==", id)
      .where("career_id", "==", jobId)
      .limit(1)
      .get();

    if (!existing.empty) {
      return sendResponse(res, 400, "Job already saved");
    }

    // Save job
    const saveRef = await db.collection("saved_careers").add({
      user_id: id,
      career_id: jobId,
      saved_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    sendResponse(res, "success", "Job saved successfully", {
      savedId: saveRef.id,
    });
    return null;
  } catch (err) {
    sendResponse(res, 500, "Error saving job", null, err.message);
    return null;
  }
});

// Unsave a job
app.delete("/api/user/:id/jobs/:jobId/save", async (req, res) => {
  const { id, jobId } = req.params;

  try {
    const snapshot = await db
      .collection("saved_careers")
      .where("user_id", "==", id)
      .where("career_id", "==", jobId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return sendResponse(res, 404, "Job not found in saved list");
    }

    await snapshot.docs[0].ref.delete();
    sendResponse(res, "success", "Job unsaved successfully");
  } catch (err) {
    sendResponse(res, 500, "Error unsaving job", null, err.message);
  }

  return null;
});

// Share a job
app.post("/api/user/:id/jobs/:jobId/share", async (req, res) => {
  const { id, jobId } = req.params;
  const BASE_URL =
    process.env.BASE_URL || "https://system-analysis-edd26.web.app";

  try {
    const shareToken = crypto.randomBytes(16).toString("hex");
    const shareUrl = `${BASE_URL}/#/share/job/${shareToken}`;

    // Check if already shared
    const existing = await db
      .collection("shared_items")
      .where("user_id", "==", id)
      .where("item_type", "==", "job")
      .where("item_id", "==", jobId)
      .limit(1)
      .get();

    if (!existing.empty) {
      const shareDoc = existing.docs[0].data();
      const existingUrl = `${BASE_URL}/#/share/job/${shareDoc.share_token}`;
      return sendResponse(res, "success", "Share URL retrieved", {
        share_url: existingUrl,
      });
    }

    // Create share
    await db.collection("shared_items").add({
      user_id: id,
      item_type: "job",
      item_id: jobId,
      share_token: shareToken,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    sendResponse(res, "success", "Job shared successfully", {
      share_url: shareUrl,
    });
    return null;
  } catch (err) {
    sendResponse(res, 500, "Error sharing job", null, err.message);
    return null;
  }
});

// Get user's applied/saved jobs
app.get("/api/user/:id/jobs", async (req, res) => {
  const { id } = req.params;
  const { status, limit = 20, page = 1 } = req.query;
  const offset = (page - 1) * limit;

  try {
    // Get applied jobs
    let appliedQuery = db
      .collection("applied_jobs")
      .where("user_id", "==", id);

    if (status) {
      appliedQuery = appliedQuery.where("status", "==", status);
    }

    const appliedSnapshot = await appliedQuery
      .orderBy("applied_at", "desc")
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .get();

    const applied = [];
    for (const doc of appliedSnapshot.docs) {
      const data = doc.data();
      const careerDoc = await db
        .collection("careers")
        .doc(data.career_id.toString())
        .get();
      if (careerDoc.exists) {
        applied.push({
          id: doc.id,
          career_id: data.career_id,
          status: data.status,
          applied_at: data.applied_at?.toDate()?.toISOString(),
          ...careerDoc.data(),
        });
      }
    }

    // Get saved jobs
    const savedSnapshot = await db
      .collection("saved_careers")
      .where("user_id", "==", id)
      .orderBy("saved_at", "desc")
      .get();

    const saved = [];
    for (const doc of savedSnapshot.docs) {
      const data = doc.data();
      const careerDoc = await db
        .collection("careers")
        .doc(data.career_id.toString())
        .get();
      if (careerDoc.exists) {
        saved.push({
          id: doc.id,
          career_id: data.career_id,
          saved_at: data.saved_at?.toDate()?.toISOString(),
          ...careerDoc.data(),
        });
      }
    }

    sendResponse(res, "success", "User jobs retrieved", {
      applied,
      saved,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: applied.length,
      },
    });
  } catch (err) {
    sendResponse(res, 500, "Database error", null, err.message);
  }
});

// Get all courses
app.get("/api/courses", async (req, res) => {
  const { search, provider, location, limit = 20, page = 1 } = req.query;
  const offset = (page - 1) * limit;

  try {
    let query = db.collection("courses");

    // Apply filters
    if (provider) {
      query = query.where("provider", ">=", provider).where(
        "provider",
        "<=",
        provider + "\uf8ff"
      );
    }

    const snapshot = await query
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .get();

    let courses = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Apply search filter (client-side for simplicity)
    if (search) {
      const searchLower = search.toLowerCase();
      courses = courses.filter(
        (course) =>
          course.title?.toLowerCase().includes(searchLower) ||
          course.description?.toLowerCase().includes(searchLower) ||
          course.provider?.toLowerCase().includes(searchLower)
      );
    }

    if (location) {
      courses = courses.filter((course) =>
        course.location?.toLowerCase().includes(location.toLowerCase())
      );
    }

    sendResponse(res, "success", "Courses retrieved", {
      courses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: courses.length,
      },
    });
  } catch (err) {
    sendResponse(res, 500, "Database error", null, err.message);
  }
});

// Enroll in a course
app.post("/api/user/:id/courses/:courseId/enroll", async (req, res) => {
  const { id, courseId } = req.params;

  try {
    const existing = await db
      .collection("enrollments")
      .where("user_id", "==", id)
      .where("course_id", "==", courseId)
      .limit(1)
      .get();

    if (!existing.empty) {
      return sendResponse(
        res,
        400,
        "You are already enrolled in this course"
      );
    }

    const enrollRef = await db.collection("enrollments").add({
      user_id: id,
      course_id: courseId,
      status: "in-progress",
      progress: 0,
      enrolled_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    sendResponse(res, "success", "Enrolled in course successfully", {
      enrollmentId: enrollRef.id,
    });
    return null;
  } catch (err) {
    sendResponse(res, 500, "Error enrolling in course", null, err.message);
    return null;
  }
});

// Save a course
app.post("/api/user/:id/courses/:courseId/save", async (req, res) => {
  const { id, courseId } = req.params;

  try {
    const existing = await db
      .collection("saved_courses")
      .where("user_id", "==", id)
      .where("course_id", "==", courseId)
      .limit(1)
      .get();

    if (!existing.empty) {
      return sendResponse(res, 400, "Course already saved");
    }

    const saveRef = await db.collection("saved_courses").add({
      user_id: id,
      course_id: courseId,
      saved_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    sendResponse(res, "success", "Course saved successfully", {
      savedId: saveRef.id,
    });
    return null;
  } catch (err) {
    sendResponse(res, 500, "Error saving course", null, err.message);
    return null;
  }
});

// Unsave a course
app.delete("/api/user/:id/courses/:courseId/save", async (req, res) => {
  const { id, courseId } = req.params;

  try {
    const snapshot = await db
      .collection("saved_courses")
      .where("user_id", "==", id)
      .where("course_id", "==", courseId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return sendResponse(res, 404, "Course not found in saved list");
    }

    await snapshot.docs[0].ref.delete();
    sendResponse(res, "success", "Course unsaved successfully");
    return null;
  } catch (err) {
    sendResponse(res, 500, "Error unsaving course", null, err.message);
    return null;
  }
});

// Share a course
app.post("/api/user/:id/courses/:courseId/share", async (req, res) => {
  const { id, courseId } = req.params;
  const BASE_URL =
    process.env.BASE_URL || "https://system-analysis-edd26.web.app";

  try {
    const shareToken = crypto.randomBytes(16).toString("hex");
    const shareUrl = `${BASE_URL}/#/share/course/${shareToken}`;

    const existing = await db
      .collection("shared_items")
      .where("user_id", "==", id)
      .where("item_type", "==", "course")
      .where("item_id", "==", courseId)
      .limit(1)
      .get();

    if (!existing.empty) {
      const shareDoc = existing.docs[0].data();
      const existingUrl = `${BASE_URL}/#/share/course/${shareDoc.share_token}`;
      return sendResponse(res, "success", "Share URL retrieved", {
        share_url: existingUrl,
      });
    }

    await db.collection("shared_items").add({
      user_id: id,
      item_type: "course",
      item_id: courseId,
      share_token: shareToken,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    sendResponse(res, "success", "Course shared successfully", {
      share_url: shareUrl,
    });
  } catch (err) {
    sendResponse(res, 500, "Error sharing course", null, err.message);
  }
  return null;
});

// Get user's enrolled/saved courses
app.get("/api/user/:id/courses", async (req, res) => {
  const { id } = req.params;
  const { status, limit = 20, page = 1 } = req.query;
  const offset = (page - 1) * limit;

  try {
    let enrolledQuery = db
      .collection("enrollments")
      .where("user_id", "==", id);

    if (status) {
      enrolledQuery = enrolledQuery.where("status", "==", status);
    }

    const enrolledSnapshot = await enrolledQuery
      .orderBy("enrolled_at", "desc")
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .get();

    const enrolled = [];
    for (const doc of enrolledSnapshot.docs) {
      const data = doc.data();
      const courseDoc = await db
        .collection("courses")
        .doc(data.course_id.toString())
        .get();
      if (courseDoc.exists) {
        enrolled.push({
          id: doc.id,
          course_id: data.course_id,
          status: data.status,
          progress: data.progress,
          enrolled_at: data.enrolled_at?.toDate()?.toISOString(),
          ...courseDoc.data(),
        });
      }
    }

    const savedSnapshot = await db
      .collection("saved_courses")
      .where("user_id", "==", id)
      .orderBy("saved_at", "desc")
      .get();

    const saved = [];
    for (const doc of savedSnapshot.docs) {
      const data = doc.data();
      const courseDoc = await db
        .collection("courses")
        .doc(data.course_id.toString())
        .get();
      if (courseDoc.exists) {
        saved.push({
          id: doc.id,
          course_id: data.course_id,
          saved_at: data.saved_at?.toDate()?.toISOString(),
          ...courseDoc.data(),
        });
      }
    }

    sendResponse(res, "success", "User courses retrieved", {
      enrolled,
      saved,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: enrolled.length,
      },
    });
  } catch (err) {
    sendResponse(res, 500, "Database error", null, err.message);
  }
});

// Share URL handler
app.get("/share/:type/:token", async (req, res) => {
  const { type, token } = req.params;

  if (type !== "job" && type !== "course") {
    return sendResponse(res, 400, "Invalid share type");
  }

  try {
    const shareSnapshot = await db
      .collection("shared_items")
      .where("item_type", "==", type)
      .where("share_token", "==", token)
      .limit(1)
      .get();

    if (shareSnapshot.empty) {
      return sendResponse(res, 404, "Share link not found or expired");
    }

    const shareItem = shareSnapshot.docs[0].data();

    if (type === "job") {
      const jobDoc = await db
        .collection("careers")
        .doc(shareItem.item_id.toString())
        .get();
      if (!jobDoc.exists) {
        return sendResponse(res, 404, "Job not found");
      }
      sendResponse(res, "success", "Job details", {
        ...jobDoc.data(),
        id: jobDoc.id,
      });
    } else {
      const courseDoc = await db
        .collection("courses")
        .doc(shareItem.item_id.toString())
        .get();
      if (!courseDoc.exists) {
        return sendResponse(res, 404, "Course not found");
      }
      sendResponse(res, "success", "Course details", {
        ...courseDoc.data(),
        id: courseDoc.id,
      });
    }
  } catch (err) {
    sendResponse(res, 500, "Database error", null, err.message);
  }
  return null;
});

// Export Express app as Firebase Function
exports.api = functions.https.onRequest(app);

