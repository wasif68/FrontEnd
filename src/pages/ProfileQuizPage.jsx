/**
 * Profile Editor Page Component (LinkedIn-style)
 *
 * This page provides a professional profile editor similar to LinkedIn:
 * - Editable fields: Full Name, Education, Interests, Skills, Bio
 * - Custom interest and skill input fields
 * - Profile picture upload with replacement
 * - Save button (no auto-save) - updates both JSON and CSV
 * - Shows success message after saving
 * - Email address display (read-only)
 *
 * Part of the app: User profile management
 * UI location: Main content area (protected route)
 * Manages: Profile editing, data persistence, dual storage sync
 */

import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import fields from "../data/profile_fields.json";
import { getCurrentUser } from "../services/authService.js";
import { loadUserJson, saveUserDataDual } from "../utils/userStorage.js";
import { getAvatarUrl } from "../utils/avatars.js";

export default function ProfileQuizPage() {
  const currentUser = getCurrentUser();
  const [form, setForm] = useState({
    name: "",
    email: "",
    education: "",
    interests: [],
    customInterest: "",
    skills: [],
    customSkill: "",
    bio: "",
    profilePicture: "",
  });
  const [originalName, setOriginalName] = useState("");
  const [originalImagePath, setOriginalImagePath] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [profileImagePreview, setProfileImagePreview] = useState("");
  const fileInputRef = useRef(null);

  // Load user data from JSON on mount
  useEffect(() => {
    const loadUserData = async () => {
      if (currentUser && currentUser.name) {
        const userJson = await loadUserJson(currentUser.name);
        if (userJson) {
          // COMPLETE OVERWRITE - Load all data from JSON (no merging)
          setForm({
            name: userJson.full_name || "",
            email: userJson.email_address || currentUser.email || "",
            education: userJson.education || "",
            interests: userJson.interests || [],
            customInterest: userJson.custom_interest || "",
            skills: userJson.skills || [],
            customSkill: userJson.custom_skill || "",
            bio: userJson.bio || "",
            profilePicture: userJson.profile_picture || "",
          });
          setOriginalName(userJson.full_name || "");
          setOriginalImagePath(userJson.profile_picture || "");
          
          // Set profile image preview
          if (userJson.profile_picture) {
            const imageUrl = getAvatarUrl(userJson.profile_picture.replace("Faces/", ""));
            setProfileImagePreview(imageUrl);
          }
        } else {
          // No JSON found, use current user data
          setForm({
            name: currentUser.name || "",
            email: currentUser.email || "",
            education: "",
            interests: [],
            customInterest: "",
            skills: [],
            customSkill: "",
            bio: "",
            profilePicture: "",
          });
          setOriginalName(currentUser.name || "");
        }
      }
      setLoading(false);
    };
    loadUserData();
  }, [currentUser]);

  const toggle = (key, val) => {
    setForm((f) => {
      const arr = new Set(f[key] || []);
      arr.has(val) ? arr.delete(val) : arr.add(val);
      return { ...f, [key]: Array.from(arr) };
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    // Create preview and store file
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageDataUrl = event.target.result;
      setProfileImagePreview(imageDataUrl);

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedName = (form.name || "user").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
      const fileExtension = file.name.split(".").pop();
      const newFileName = `${sanitizedName}_${timestamp}.${fileExtension}`;
      const imagePath = `Faces/${newFileName}`;

      // Store file in localStorage (simulated file system)
      // In production, this would upload to a server
      const fileData = {
        name: newFileName,
        path: imagePath,
        data: imageDataUrl, // Base64 encoded
      };
      
      // Store image data
      localStorage.setItem(`profile_image_${newFileName}`, JSON.stringify(fileData));
      
      // Update form with new image path
      setForm((prev) => ({ ...prev, profilePicture: imagePath }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!currentUser || !currentUser.email) {
      alert("Please log in to save your profile");
      return;
    }

    setSaving(true);
    setSuccessMessage("");

    try {
      // Prepare complete user data (COMPLETE OVERWRITE - no merging)
      const userData = {
        full_name: form.name,
        email_address: form.email || currentUser.email,
        password: currentUser.password || "",
        gender: currentUser.gender || "",
        country: currentUser.country || "",
        year: currentUser.year || "",
        education: form.education,
        interests: form.interests, // Complete replacement
        custom_interest: form.customInterest,
        skills: form.skills, // Complete replacement
        custom_skill: form.customSkill,
        profile_picture: form.profilePicture,
        bio: form.bio,
        recommendations_saved: currentUser.recommendations_saved || [],
        recommendations_selected: currentUser.recommendations_selected || [],
        recommendations_rejected: currentUser.recommendations_rejected || [],
      };

      // Determine if name changed
      const nameChanged = originalName && originalName !== form.name;
      const oldName = nameChanged ? originalName : null;

      // Determine if image changed
      const imageChanged = originalImagePath && originalImagePath !== form.profilePicture;
      const oldImagePath = imageChanged ? originalImagePath : null;

      // Save to both JSON and CSV (complete overwrite)
      const saved = await saveUserDataDual(userData, oldName, oldImagePath);

      if (saved) {
        // Update original values
        setOriginalName(form.name);
        setOriginalImagePath(form.profilePicture);
        
        // Update current user in localStorage
        const updatedUser = {
          ...currentUser,
          name: form.name,
          avatar: form.profilePicture.replace("Faces/", ""),
        };
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));

        setSuccessMessage("Profile updated successfully.");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        alert("Failed to save profile. Please try again.");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("An error occurred while saving your profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div style={{ textAlign: "center", padding: "40px" }}>
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Edit Profile</h2>
      
      {successMessage && (
        <div
          style={{
            background: "#1f3a1f",
            color: "#6bff6b",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #2f5a2f",
            marginBottom: "16px",
          }}
        >
          {successMessage}
        </div>
      )}

      <div className="form">
        {/* Profile Picture Upload */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ marginBottom: 8, fontWeight: 600 }}>Profile Picture</div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {profileImagePreview ? (
              <img
                src={profileImagePreview}
                alt="Profile"
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "#212c3a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#8896ab",
                }}
              >
                No Image
              </div>
            )}
            <div>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageUpload}
                style={{ display: "none" }}
              />
              <button
                className="btn"
                onClick={() => fileInputRef.current?.click()}
              >
                {form.profilePicture ? "Change Picture" : "Upload Picture"}
              </button>
              {form.profilePicture && (
                <div style={{ fontSize: "12px", color: "#8896ab", marginTop: "4px" }}>
                  {form.profilePicture.replace("Faces/", "")}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* My Profile Section */}
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ marginBottom: "12px", fontSize: "18px" }}>My Profile</h3>
          <div className="inline" style={{ marginBottom: "12px" }}>
            <input
              className="input"
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={{ flex: 1 }}
            />
            <input
              className="input"
              placeholder="Email address"
              value={form.email}
              disabled
              style={{ flex: 1, opacity: 0.6, cursor: "not-allowed" }}
            />
          </div>
          <div>
            <select
              className="select"
              value={form.education}
              onChange={(e) => setForm({ ...form, education: e.target.value })}
              style={{ width: "100%" }}
            >
              <option value="">Select Education (HSC / Diploma / BSc)</option>
              {fields.education.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Interests Section */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ marginBottom: 8, fontWeight: 600 }}>Interests</div>
          <div className="inline" style={{ marginBottom: "12px" }}>
            {fields.interests.slice(0, 6).map((x) => (
              <button
                key={x}
                className="btn"
                type="button"
                style={{
                  background: (form.interests || []).includes(x)
                    ? "#284264"
                    : "#212c3a",
                }}
                onClick={() => toggle("interests", x)}
              >
                {x}
              </button>
            ))}
          </div>
          <div>
            <input
              className="input"
              placeholder="Custom interest (type your own)"
              value={form.customInterest}
              onChange={(e) => setForm({ ...form, customInterest: e.target.value })}
              style={{ width: "100%" }}
            />
          </div>
        </div>

        {/* Skills Section */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ marginBottom: 8, fontWeight: 600 }}>Skills</div>
          <div className="inline" style={{ marginBottom: "12px" }}>
            {fields.skills.slice(0, 8).map((x) => (
              <button
                key={x}
                className="btn"
                type="button"
                style={{
                  background: (form.skills || []).includes(x)
                    ? "#284264"
                    : "#212c3a",
                }}
                onClick={() => toggle("skills", x)}
              >
                {x}
              </button>
            ))}
          </div>
          <div>
            <input
              className="input"
              placeholder="Custom skill (type your own)"
              value={form.customSkill}
              onChange={(e) => setForm({ ...form, customSkill: e.target.value })}
              style={{ width: "100%" }}
            />
          </div>
        </div>

        {/* Describe Myself Section */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ marginBottom: 8, fontWeight: 600 }}>Describe Myself</div>
          <textarea
            className="input"
            placeholder="Write about yourself, your experience, goals, etc."
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            style={{
              width: "100%",
              minHeight: "120px",
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* Save Button */}
        <div className="inline" style={{ marginTop: "24px", justifyContent: "space-between" }}>
          <button
            className="btn primary"
            onClick={handleSave}
            disabled={saving}
            style={{ flex: 1, maxWidth: "200px" }}
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
          <Link className="btn" to="/recommendations" style={{ textDecoration: "none" }}>
            See Recommendations
          </Link>
        </div>
      </div>
    </div>
  );
}
