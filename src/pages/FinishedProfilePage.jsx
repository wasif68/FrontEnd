/**
 * Finished Profile Page
 *
 * Displays a user's complete profile with real-time Firestore updates.
 * Uses onSnapshot listeners for automatic UI updates without refresh.
 */
import { useEffect, useState } from "react";
import { useUserData } from "@/contexts/UserDataContext";
import { getCurrentUser } from "@/services/authService";
import { db } from "@/config/firebase";
import {
  doc,
  getDoc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { getAvatarUrl } from "@/utils/avatars";
import catalog from "@/data/careers_bd.json";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProfileCompletionWidget from "../../radial-progress-bar/exampleIntegration.jsx";
import "./FinishedProfilePage.css";

export default function FinishedProfilePage() {
  const currentUser = getCurrentUser(); // From localStorage
  const { refreshUserData } = useUserData();
  const [activeTab, setActiveTab] = useState("courses");

  // All state using useState for proper re-renders
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [savedCourses, setSavedCourses] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [selectedCareers, setSelectedCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get default profile image based on gender
  const getDefaultProfileImage = (gender) => {
    if (gender === "female") {
      return "/images/default-female.png";
    } else if (gender === "male") {
      return "/images/default-male.png";
    }
    return "https://i.pravatar.cc/150";
  };

  // Get profile image URL
  const getProfileImageUrl = () => {
    if (user?.profileImage) {
      return user.profileImage;
    }
    if (user?.avatarFile) {
      return getAvatarUrl(user.avatarFile);
    }
    if (currentUser?.avatar) {
      return getAvatarUrl(currentUser.avatar);
    }
    return getDefaultProfileImage(user?.gender);
  };

  useEffect(() => {
    if (!currentUser || !currentUser.id) {
      setError("User not found or invalid. Please log in.");
      setLoading(false);
      return;
    }

    console.log("🔄 Setting up real-time listeners for user:", currentUser.id);
    setLoading(true);
    setError(null);

    // Real-time listener for users collection
    const unsubscribeUser = onSnapshot(
      doc(db, "users", currentUser.id),
      (userDoc) => {
        if (!userDoc.exists()) {
          console.warn("⚠️ User document not found");
          setError("User not found");
          setLoading(false);
          return;
        }

        const userData = { id: userDoc.id, ...userDoc.data() };
        console.log("✅ Real-time user data update:", userData);
        setUser(userData);

        // Update recommendations from user document
        if (
          userData.recommendations &&
          Array.isArray(userData.recommendations)
        ) {
          console.log("📋 Recommendations updated:", userData.recommendations);
          setRecommendations([...userData.recommendations]); // Create new array to trigger re-render
        }

        // Update courses from user document
        if (userData.courses && Array.isArray(userData.courses)) {
          console.log("📚 Courses updated:", userData.courses);
          setCourses([...userData.courses]); // Create new array to trigger re-render
        }
      },
      (error) => {
        console.error("❌ Error listening to user document:", error);
        setError(error.message || "Failed to load user data");
        setLoading(false);
      }
    );

    // Real-time listener for user_profiles collection
    const unsubscribeProfile = onSnapshot(
      doc(db, "user_profiles", currentUser.id),
      async (profileDoc) => {
        const profileData = profileDoc.exists()
          ? profileDoc.data()
          : {
              education: null,
              interests: [],
              skills_selected: [],
              bio: null,
              completion_percentage: 0,
            };
        console.log("✅ Real-time profile data update:", profileData);
        setProfile(profileData);

        // Update selected careers from recommendations_selected
        if (
          profileData.recommendations_selected &&
          Array.isArray(profileData.recommendations_selected)
        ) {
          const selectedCareersList = profileData.recommendations_selected
            .map((title) => catalog.find((c) => c.title === title))
            .filter(Boolean);
          console.log("🎯 Selected careers updated:", selectedCareersList);
          setSelectedCareers([...selectedCareersList]); // Create new array to trigger re-render
        }
      },
      (error) => {
        console.error("❌ Error listening to profile document:", error);
        setError(error.message || "Failed to load profile data");
        setLoading(false);
      }
    );

    // Real-time listener for enrollments (user_courses equivalent)
    const unsubscribeEnrollments = onSnapshot(
      query(
        collection(db, "enrollments"),
        where("user_id", "==", currentUser.id.toString())
      ),
      async (snapshot) => {
        console.log(`📊 Enrollments updated: ${snapshot.size} found`);
        const enrolled = [];

        for (const enrollmentDoc of snapshot.docs) {
          const data = enrollmentDoc.data();
          try {
            const courseDoc = await getDoc(
              doc(db, "courses", data.course_id.toString())
            );
            if (courseDoc.exists()) {
              const courseData = courseDoc.data();
              enrolled.push({
                id: enrollmentDoc.id,
                course_id: data.course_id,
                status: data.status,
                progress: data.progress,
                enrolled_at: data.enrolled_at?.toDate()?.toISOString(),
                ...courseData,
              });
            }
          } catch (err) {
            console.warn("Error loading course for enrollment:", err);
          }
        }

        // Sort by enrolled_at descending
        enrolled.sort((a, b) => {
          const aTime = a.enrolled_at ? new Date(a.enrolled_at).getTime() : 0;
          const bTime = b.enrolled_at ? new Date(b.enrolled_at).getTime() : 0;
          return bTime - aTime;
        });

        console.log("✅ Enrolled courses updated:", enrolled);
        setEnrolledCourses([...enrolled]); // Create new array to trigger re-render
      },
      (error) => {
        console.error("❌ Error listening to enrollments:", error);
      }
    );

    // Real-time listener for saved_courses
    const unsubscribeSavedCourses = onSnapshot(
      query(
        collection(db, "saved_courses"),
        where("user_id", "==", currentUser.id.toString())
      ),
      async (snapshot) => {
        console.log(`📊 Saved courses updated: ${snapshot.size} found`);
        const saved = [];

        for (const savedDoc of snapshot.docs) {
          const data = savedDoc.data();
          try {
            const courseDoc = await getDoc(
              doc(db, "courses", data.course_id.toString())
            );
            if (courseDoc.exists()) {
              const courseData = courseDoc.data();
              saved.push({
                id: savedDoc.id,
                course_id: data.course_id,
                saved_at: data.saved_at?.toDate()?.toISOString(),
                ...courseData,
              });
            }
          } catch (err) {
            console.warn("Error loading course for saved:", err);
          }
        }

        // Sort by saved_at descending
        saved.sort((a, b) => {
          const aTime = a.saved_at ? new Date(a.saved_at).getTime() : 0;
          const bTime = b.saved_at ? new Date(b.saved_at).getTime() : 0;
          return bTime - aTime;
        });

        console.log("✅ Saved courses updated:", saved);
        setSavedCourses([...saved]); // Create new array to trigger re-render
      },
      (error) => {
        console.error("❌ Error listening to saved courses:", error);
      }
    );

    // Real-time listener for applied_jobs
    const unsubscribeAppliedJobs = onSnapshot(
      query(
        collection(db, "applied_jobs"),
        where("user_id", "==", currentUser.id.toString())
      ),
      async (snapshot) => {
        console.log(`📊 Applied jobs updated: ${snapshot.size} found`);
        const applied = [];

        for (const appliedDoc of snapshot.docs) {
          const data = appliedDoc.data();
          try {
            const careerDoc = await getDoc(
              doc(db, "careers", data.career_id.toString())
            );
            if (careerDoc.exists()) {
              const careerData = careerDoc.data();
              applied.push({
                id: appliedDoc.id,
                career_id: data.career_id,
                status: data.status,
                applied_at: data.applied_at?.toDate()?.toISOString(),
                ...careerData,
              });
            }
          } catch (err) {
            console.warn("Error loading career for applied job:", err);
          }
        }

        // Sort by applied_at descending
        applied.sort((a, b) => {
          const aTime = a.applied_at ? new Date(a.applied_at).getTime() : 0;
          const bTime = b.applied_at ? new Date(b.applied_at).getTime() : 0;
          return bTime - aTime;
        });

        console.log("✅ Applied jobs updated:", applied);
        setAppliedJobs([...applied]); // Create new array to trigger re-render
      },
      (error) => {
        console.error("❌ Error listening to applied jobs:", error);
      }
    );

    // Real-time listener for saved_careers (user_jobs equivalent)
    const unsubscribeSavedJobs = onSnapshot(
      query(
        collection(db, "saved_careers"),
        where("user_id", "==", currentUser.id.toString())
      ),
      async (snapshot) => {
        console.log(`📊 Saved jobs updated: ${snapshot.size} found`);
        const saved = [];

        for (const savedDoc of snapshot.docs) {
          const data = savedDoc.data();
          try {
            const careerDoc = await getDoc(
              doc(db, "careers", data.career_id.toString())
            );
            if (careerDoc.exists()) {
              const careerData = careerDoc.data();
              saved.push({
                id: savedDoc.id,
                career_id: data.career_id,
                saved_at: data.saved_at?.toDate()?.toISOString(),
                ...careerData,
              });
            }
          } catch (err) {
            console.warn("Error loading career for saved job:", err);
          }
        }

        // Sort by saved_at descending
        saved.sort((a, b) => {
          const aTime = a.saved_at ? new Date(a.saved_at).getTime() : 0;
          const bTime = b.saved_at ? new Date(b.saved_at).getTime() : 0;
          return bTime - aTime;
        });

        console.log("✅ Saved jobs updated:", saved);
        setSavedJobs([...saved]); // Create new array to trigger re-render
      },
      (error) => {
        console.error("❌ Error listening to saved jobs:", error);
      }
    );

    // Initial loading complete
    setLoading(false);
    refreshUserData();

    // Cleanup all listeners on unmount
    return () => {
      console.log("🧹 Cleaning up real-time listeners");
      unsubscribeUser();
      unsubscribeProfile();
      unsubscribeEnrollments();
      unsubscribeSavedCourses();
      unsubscribeAppliedJobs();
      unsubscribeSavedJobs();
    };
  }, [currentUser?.id, refreshUserData]);

  if (loading) {
    return (
      <div className="finished-profile-container">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="finished-profile-container error-state">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="finished-profile-container">
        <p>No user data found.</p>
      </div>
    );
  }

  // Combine user and profile data
  const userData = {
    ...user,
    education: profile?.education || user.education || null,
    interests: profile?.interests || user.interests || [],
    skills_selected: profile?.skills_selected || user.skills || [],
    bio: profile?.bio || user.bio || null,
    recommendations:
      recommendations.length > 0 ? recommendations : user.recommendations || [],
    courses: courses.length > 0 ? courses : user.courses || [],
    completion_percentage: profile?.completion_percentage || 0,
  };

  const profileImageUrl = getProfileImageUrl();

  return (
    <ErrorBoundary>
      <div className="finished-profile-container">
        <div className="profile-grid">
          <div className="profile-header-container">
            <div className="profile-header">
              <img
                src={profileImageUrl}
                alt="Profile"
                className="profile-image"
                onError={(e) => {
                  // Fallback to default if image fails to load
                  e.target.src = getDefaultProfileImage(user.gender);
                }}
              />
              <div className="profile-info">
                <h1 className="profile-name">{userData.name || "User"}</h1>
                <p className="profile-email">{userData.email || ""}</p>
                {userData.gender && (
                  <p
                    className="profile-gender"
                    style={{ color: "var(--muted)", fontSize: "0.9rem" }}
                  >
                    {userData.gender.charAt(0).toUpperCase() +
                      userData.gender.slice(1)}
                  </p>
                )}
                {userData.country && (
                  <p className="profile-location">{userData.country}</p>
                )}
              </div>
            </div>
          </div>

          <div className="profile-widget-container">
            <ProfileCompletionWidget
              profileData={{
                user: userData,
                enrolledCourses,
                savedCourses,
                appliedJobs,
                savedJobs,
              }}
              loading={loading}
              error={error}
            />
          </div>
        </div>

        {/* Profile Information Section */}
        <div
          className="profile-info-section"
          style={{
            marginBottom: "2rem",
            padding: "1.5rem",
            background: "var(--card)",
            borderRadius: "12px",
          }}
        >
          <h2
            style={{
              marginBottom: "1.5rem",
              fontSize: "1.5rem",
              fontWeight: "600",
            }}
          >
            My Profile
          </h2>

          {/* Education */}
          {userData.education && (
            <div style={{ marginBottom: "1.5rem" }}>
              <h3
                style={{
                  marginBottom: "0.5rem",
                  fontSize: "1rem",
                  fontWeight: "600",
                  color: "var(--muted)",
                }}
              >
                Education
              </h3>
              <p style={{ fontSize: "1rem" }}>{userData.education}</p>
            </div>
          )}

          {/* Interests */}
          {userData.interests && userData.interests.length > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <h3
                style={{
                  marginBottom: "0.75rem",
                  fontSize: "1rem",
                  fontWeight: "600",
                  color: "var(--muted)",
                }}
              >
                Interests
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {userData.interests.map((interest, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: "0.5rem 1rem",
                      background: "var(--accent)",
                      color: "white",
                      borderRadius: "20px",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                    }}
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {userData.skills_selected && userData.skills_selected.length > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <h3
                style={{
                  marginBottom: "0.75rem",
                  fontSize: "1rem",
                  fontWeight: "600",
                  color: "var(--muted)",
                }}
              >
                Skills
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {userData.skills_selected.map((skill, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: "0.5rem 1rem",
                      background: "var(--panel)",
                      color: "var(--text)",
                      borderRadius: "20px",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bio */}
          {userData.bio && (
            <div style={{ marginBottom: "1.5rem" }}>
              <h3
                style={{
                  marginBottom: "0.5rem",
                  fontSize: "1rem",
                  fontWeight: "600",
                  color: "var(--muted)",
                }}
              >
                About Me
              </h3>
              <p
                style={{
                  fontSize: "1rem",
                  lineHeight: "1.6",
                  whiteSpace: "pre-wrap",
                }}
              >
                {userData.bio}
              </p>
            </div>
          )}

          {/* Recommendations from user document */}
          {userData.recommendations && userData.recommendations.length > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <h3
                style={{
                  marginBottom: "0.75rem",
                  fontSize: "1rem",
                  fontWeight: "600",
                  color: "var(--muted)",
                }}
              >
                Recommendations
              </h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {userData.recommendations.map((rec, idx) => (
                  <li
                    key={idx}
                    style={{
                      padding: "0.5rem 0",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Courses from user document */}
          {userData.courses && userData.courses.length > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <h3
                style={{
                  marginBottom: "0.75rem",
                  fontSize: "1rem",
                  fontWeight: "600",
                  color: "var(--muted)",
                }}
              >
                Courses
              </h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {userData.courses.map((course, idx) => (
                  <li
                    key={idx}
                    style={{
                      padding: "0.5rem 0",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {course}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Selected Career Recommendations Section */}
        {(selectedCareers && selectedCareers.length > 0) ||
        (savedJobs && savedJobs.length > 0) ? (
          <div
            className="selected-careers-section"
            style={{
              marginBottom: "2rem",
              padding: "1.5rem",
              background: "var(--card)",
              borderRadius: "12px",
            }}
          >
            <h2
              style={{
                marginBottom: "1.5rem",
                fontSize: "1.5rem",
                fontWeight: "600",
              }}
            >
              Selected Career Recommendations
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "1rem",
              }}
            >
              {selectedCareers &&
                selectedCareers.length > 0 &&
                selectedCareers.map((career, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "1rem",
                      background: "var(--panel)",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <h3
                      style={{
                        marginBottom: "0.5rem",
                        fontSize: "1.1rem",
                        fontWeight: "600",
                      }}
                    >
                      {career.title}
                    </h3>
                    {career.company && (
                      <p
                        style={{
                          marginBottom: "0.5rem",
                          fontSize: "0.9rem",
                          color: "var(--muted)",
                        }}
                      >
                        {career.company}
                      </p>
                    )}
                    {career.location && (
                      <p
                        style={{
                          marginBottom: "0.5rem",
                          fontSize: "0.9rem",
                          color: "var(--muted)",
                        }}
                      >
                        📍 {career.location}
                      </p>
                    )}
                    {career.description && (
                      <p
                        style={{
                          fontSize: "0.875rem",
                          lineHeight: "1.5",
                          color: "var(--text)",
                          marginTop: "0.5rem",
                        }}
                      >
                        {career.description.substring(0, 150)}
                        {career.description.length > 150 ? "..." : ""}
                      </p>
                    )}
                    {career.skills && career.skills.length > 0 && (
                      <div
                        style={{
                          marginTop: "0.75rem",
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "0.5rem",
                        }}
                      >
                        {career.skills.slice(0, 3).map((skill, skillIdx) => (
                          <span
                            key={skillIdx}
                            style={{
                              padding: "0.25rem 0.5rem",
                              background: "var(--accent)",
                              color: "white",
                              borderRadius: "12px",
                              fontSize: "0.75rem",
                            }}
                          >
                            {skill}
                          </span>
                        ))}
                        {career.skills.length > 3 && (
                          <span
                            style={{
                              padding: "0.25rem 0.5rem",
                              color: "var(--muted)",
                              fontSize: "0.75rem",
                            }}
                          >
                            +{career.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}

              {(!selectedCareers || selectedCareers.length === 0) &&
                savedJobs &&
                savedJobs.length > 0 &&
                savedJobs.map((job, idx) => (
                  <div
                    key={job.id || idx}
                    style={{
                      padding: "1rem",
                      background: "var(--panel)",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <h3
                      style={{
                        marginBottom: "0.5rem",
                        fontSize: "1.1rem",
                        fontWeight: "600",
                      }}
                    >
                      {job.title}
                    </h3>
                    {job.company && (
                      <p
                        style={{
                          marginBottom: "0.5rem",
                          fontSize: "0.9rem",
                          color: "var(--muted)",
                        }}
                      >
                        {job.company}
                      </p>
                    )}
                    {job.location && (
                      <p
                        style={{
                          marginBottom: "0.5rem",
                          fontSize: "0.9rem",
                          color: "var(--muted)",
                        }}
                      >
                        📍 {job.location}
                      </p>
                    )}
                    {job.description && (
                      <p
                        style={{
                          fontSize: "0.875rem",
                          lineHeight: "1.5",
                          color: "var(--text)",
                          marginTop: "0.5rem",
                        }}
                      >
                        {job.description.substring(0, 150)}
                        {job.description.length > 150 ? "..." : ""}
                      </p>
                    )}
                    {job.skills && job.skills.length > 0 && (
                      <div
                        style={{
                          marginTop: "0.75rem",
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "0.5rem",
                        }}
                      >
                        {job.skills.slice(0, 3).map((skill, skillIdx) => (
                          <span
                            key={skillIdx}
                            style={{
                              padding: "0.25rem 0.5rem",
                              background: "var(--accent)",
                              color: "white",
                              borderRadius: "12px",
                              fontSize: "0.75rem",
                            }}
                          >
                            {skill}
                          </span>
                        ))}
                        {job.skills.length > 3 && (
                          <span
                            style={{
                              padding: "0.25rem 0.5rem",
                              color: "var(--muted)",
                              fontSize: "0.75rem",
                            }}
                          >
                            +{job.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ) : null}

        <div className="profile-tabs">
          <button
            className={`tab-button ${activeTab === "courses" ? "active" : ""}`}
            onClick={() => setActiveTab("courses")}
          >
            Courses ({enrolledCourses.length} enrolled, {savedCourses.length}{" "}
            saved)
          </button>
          <button
            className={`tab-button ${activeTab === "jobs" ? "active" : ""}`}
            onClick={() => setActiveTab("jobs")}
          >
            Jobs ({appliedJobs.length} applied, {savedJobs.length} saved)
          </button>
        </div>

        <div className="tab-content">
          {activeTab === "courses" && (
            <div className="courses-section">
              {/* Enrolled Courses */}
              {enrolledCourses && enrolledCourses.length > 0 ? (
                <div className="section">
                  <h2 className="section-title">Enrolled Courses</h2>
                  <div className="items-grid">
                    {enrolledCourses.map((course) => (
                      <div key={course.id} className="item-card">
                        <h3 className="item-title">{course.title}</h3>
                        <p className="item-provider">{course.provider}</p>
                        <p className="item-location">{course.location}</p>
                        {course.description && (
                          <p className="item-description">
                            {course.description}
                          </p>
                        )}
                        <div className="item-meta">
                          <span
                            className={`status-badge ${
                              course.status === "completed"
                                ? "completed"
                                : "in-progress"
                            }`}
                          >
                            {course.status === "completed"
                              ? "Completed"
                              : "In Progress"}
                          </span>
                          {course.progress !== undefined && (
                            <span className="progress-text">
                              Progress: {course.progress}%
                            </span>
                          )}
                          {course.enrolled_at && (
                            <span className="date-text">
                              Enrolled:{" "}
                              {new Date(
                                course.enrolled_at
                              ).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <p>No enrolled courses yet.</p>
                </div>
              )}

              {/* Saved Courses */}
              {savedCourses && savedCourses.length > 0 && (
                <div className="section">
                  <h2 className="section-title">Saved Courses</h2>
                  <div className="items-grid">
                    {savedCourses.map((course) => (
                      <div key={course.id} className="item-card">
                        <h3 className="item-title">{course.title}</h3>
                        <p className="item-provider">{course.provider}</p>
                        <p className="item-location">{course.location}</p>
                        {course.description && (
                          <p className="item-description">
                            {course.description}
                          </p>
                        )}
                        <div className="item-meta">
                          {course.saved_at && (
                            <span className="date-text">
                              Saved:{" "}
                              {new Date(course.saved_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "jobs" && (
            <div className="jobs-section">
              {/* Applied Jobs */}
              {appliedJobs && appliedJobs.length > 0 ? (
                <div className="section">
                  <h2 className="section-title">Applied Jobs</h2>
                  <div className="items-grid">
                    {appliedJobs.map((job) => (
                      <div key={job.id} className="item-card">
                        <h3 className="item-title">{job.title}</h3>
                        <p className="item-company">{job.company}</p>
                        <p className="item-location">{job.location}</p>
                        {job.description && (
                          <p className="item-description">{job.description}</p>
                        )}
                        <div className="item-meta">
                          <span
                            className={`status-badge ${
                              job.status || "pending"
                            }`}
                          >
                            {(job.status || "pending").charAt(0).toUpperCase() +
                              (job.status || "pending").slice(1)}
                          </span>
                          {job.applied_at && (
                            <span className="date-text">
                              Applied:{" "}
                              {new Date(job.applied_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <p>No applied jobs yet.</p>
                </div>
              )}

              {/* Saved Jobs */}
              {savedJobs && savedJobs.length > 0 && (
                <div className="section">
                  <h2 className="section-title">Saved Jobs</h2>
                  <div className="items-grid">
                    {savedJobs.map((job) => (
                      <div key={job.id} className="item-card">
                        <h3 className="item-title">{job.title}</h3>
                        <p className="item-company">{job.company}</p>
                        <p className="item-location">{job.location}</p>
                        {job.description && (
                          <p className="item-description">{job.description}</p>
                        )}
                        <div className="item-meta">
                          {job.saved_at && (
                            <span className="date-text">
                              Saved:{" "}
                              {new Date(job.saved_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
