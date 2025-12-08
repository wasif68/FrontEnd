/**
 * Profile Tab Component (Enhanced with Album System)
 *
 * Facebook-style profile picture album with multiple images
 * Inline editable tags, sticky save button, toast notifications
 */

import { useEffect, useState, useRef } from "react";
import fields from "@/data/profile_fields.json";
import { getCurrentUser } from "@/services/authService.js";
import { loadUserJson, saveUserDataDual } from "@/utils/userStorage.js";
import { getAvatarUrl } from "@/utils/avatars.js";
import { sanitizeProfile } from "@/utils/sanitize.js";
import Toast from "@/components/Toast";
import "./ProfileTab.css";

export default function ProfileTab({ onProfileUpdate }) {
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
    profilePictures: [],
  });
  const [originalName, setOriginalName] = useState("");
  const [originalForm, setOriginalForm] = useState({
    name: "",
    email: "",
    education: "",
    interests: [],
    customInterest: "",
    skills: [],
    customSkill: "",
    bio: "",
    profilePicture: "",
    profilePictures: [],
  }); // Initialize with empty form structure
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState("");
  const [showAlbum, setShowAlbum] = useState(false);
  const fileInputRef = useRef(null);

  // Load user data from JSON on mount - with timeout and error handling
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();
    
    const loadUserData = async () => {
      try {
        if (currentUser && (currentUser.id || currentUser.name)) {
          // Add timeout to prevent hanging
          const loadPromise = loadUserJson(
            currentUser.id || currentUser.name,
            !!currentUser.id // useId flag
          );
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Load timeout")), 5000)
          );
          
          const userJson = await Promise.race([loadPromise, timeoutPromise]);

          if (userJson && isMounted) {
            const profilePics = userJson.profilePictures || [];
            const currentProfilePic =
              profilePics.find((pic) => pic.isProfile)?.path ||
              userJson.profile_picture ||
              currentUser.avatar ||
              "";

            const loadedForm = {
              name: userJson.full_name || currentUser.name || "",
              email: userJson.email_address || currentUser.email || "",
              education: userJson.education || "",
              interests: userJson.interests || [],
              customInterest: userJson.custom_interest || "",
              skills: userJson.skills || [],
              customSkill: userJson.custom_skill || "",
              bio: userJson.bio || "",
              profilePicture: currentProfilePic,
              profilePictures: profilePics,
            };
            if (isMounted) {
              setForm(loadedForm);
              setOriginalForm(JSON.parse(JSON.stringify(loadedForm))); // Deep copy for comparison
              setOriginalName(userJson.full_name || currentUser.name || "");
            }

            // Load profile image preview - handle both Base64 and avatar file names
            if (currentProfilePic && isMounted) {
              // Check if it's a Base64 image stored in localStorage
              const fileName = currentProfilePic.replace("Faces/", "");
              const imageData = localStorage.getItem(`profile_image_${fileName}`);
              if (imageData) {
                try {
                  const parsed = JSON.parse(imageData);
                  if (isMounted) setProfileImagePreview(parsed.data);
                } catch (e) {
                  // Fallback to avatar URL
                  const imageUrl = getAvatarUrl(fileName);
                  if (isMounted) setProfileImagePreview(imageUrl);
                }
              } else {
                // Use avatar URL from catalog
                const imageUrl = getAvatarUrl(fileName);
                if (isMounted) setProfileImagePreview(imageUrl);
              }
            } else if (currentUser.avatar && isMounted) {
              // Fallback to currentUser avatar if no profile picture in JSON
              const imageUrl = getAvatarUrl(currentUser.avatar);
              setProfileImagePreview(imageUrl);
              setForm((prev) => ({
                ...prev,
                profilePicture: currentUser.avatar,
              }));
            } else if (currentUser.avatarUrl && isMounted) {
              // Use avatarUrl directly if available
              setProfileImagePreview(currentUser.avatarUrl);
            } else if (isMounted) {
              // No avatar at all - set empty string to show placeholder
              setProfileImagePreview("");
            }
          } else if (isMounted) {
            // No JSON data, use currentUser data
            const avatarPath = currentUser.avatar || "";
            const loadedForm = {
              name: currentUser.name || "",
              email: currentUser.email || "",
              education: "",
              interests: [],
              customInterest: "",
              skills: [],
              customSkill: "",
              bio: "",
              profilePicture: avatarPath,
              profilePictures: [],
            };
            setForm(loadedForm);
            setOriginalForm(JSON.parse(JSON.stringify(loadedForm))); // Deep copy for comparison
            setOriginalName(currentUser.name || "");

            // Load avatar from currentUser
            if (currentUser.avatarUrl) {
              setProfileImagePreview(currentUser.avatarUrl);
            } else if (currentUser.avatar) {
              const imageUrl = getAvatarUrl(currentUser.avatar);
              setProfileImagePreview(imageUrl);
            }
          }
        } else if (isMounted) {
          // No currentUser, set empty form
          const emptyForm = {
            name: "",
            email: "",
            education: "",
            interests: [],
            customInterest: "",
            skills: [],
            customSkill: "",
            bio: "",
            profilePicture: "",
            profilePictures: [],
          };
          setForm(emptyForm);
          setOriginalForm(JSON.parse(JSON.stringify(emptyForm)));
          setOriginalName("");
        }
      } catch (error) {
        console.error("Error loading profile data:", error);
        if (isMounted) {
          // Set default form on error
          const loadedForm = {
            name: currentUser?.name || "",
            email: currentUser?.email || "",
            education: "",
            interests: [],
            customInterest: "",
            skills: [],
            customSkill: "",
            bio: "",
            profilePicture: "",
            profilePictures: [],
          };
          setForm(loadedForm);
          setOriginalForm(JSON.parse(JSON.stringify(loadedForm)));
          setOriginalName(currentUser?.name || "");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    loadUserData();
    
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [currentUser?.id, currentUser?.name]); // Only depend on specific fields

  const toggle = (key, val) => {
    setForm((f) => {
      const arr = new Set(f[key] || []);
      arr.has(val) ? arr.delete(val) : arr.add(val);
      return { ...f, [key]: Array.from(arr) };
    });
  };

  const removeTag = (key, val) => {
    setForm((f) => ({
      ...f,
      [key]: (f[key] || []).filter((item) => item !== val),
    }));
  };

  const addCustomTag = (key, customKey) => {
    const customValue = form[customKey].trim();
    if (customValue && !form[key].includes(customValue)) {
      setForm((f) => ({
        ...f,
        [key]: [...f[key], customValue],
        [customKey]: "",
      }));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setToast({ message: "Please select an image file", type: "error" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: "Image size must be less than 5MB", type: "error" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageDataUrl = event.target.result;
      const timestamp = Date.now();
      const sanitizedName = (form.name || "user")
        .replace(/[^a-zA-Z0-9]/g, "_")
        .toLowerCase();
      const fileExtension = file.name.split(".").pop();
      const newFileName = `${sanitizedName}_${timestamp}.${fileExtension}`;
      const imagePath = `Faces/${newFileName}`;

      // Store image in localStorage
      const fileData = {
        name: newFileName,
        path: imagePath,
        data: imageDataUrl,
      };
      localStorage.setItem(
        `profile_image_${newFileName}`,
        JSON.stringify(fileData)
      );

      // Update profilePictures array - mark all as not profile, add new one as profile
      const updatedPictures = form.profilePictures.map((pic) => ({
        ...pic,
        isProfile: false,
      }));
      updatedPictures.push({
        path: imagePath,
        isProfile: true,
      });

      setForm((prev) => ({
        ...prev,
        profilePicture: imagePath,
        profilePictures: updatedPictures,
      }));

      setProfileImagePreview(imageDataUrl);
      setToast({
        message: "Profile picture uploaded successfully",
        type: "success",
      });
    };
    reader.readAsDataURL(file);
  };

  const setProfilePictureFromAlbum = (imagePath) => {
    const updatedPictures = form.profilePictures.map((pic) => ({
      ...pic,
      isProfile: pic.path === imagePath,
    }));

    setForm((prev) => ({
      ...prev,
      profilePicture: imagePath,
      profilePictures: updatedPictures,
    }));

    // Load preview from localStorage or use avatar URL
    const imageData = localStorage.getItem(
      `profile_image_${imagePath.replace("Faces/", "")}`
    );
    if (imageData) {
      const parsed = JSON.parse(imageData);
      setProfileImagePreview(parsed.data);
    } else {
      const imageUrl = getAvatarUrl(imagePath.replace("Faces/", ""));
      setProfileImagePreview(imageUrl);
    }

    setToast({ message: "Profile picture updated", type: "success" });
  };

  // Check if form has any changes compared to original
  const hasChanges = () => {
    if (!originalForm) return true; // If no original data, assume there are changes

    // If originalForm is empty (initial state), check if form has any data
    const isOriginalEmpty =
      !originalForm.name &&
      !originalForm.email &&
      originalForm.interests?.length === 0 &&
      originalForm.skills?.length === 0;

    if (isOriginalEmpty) {
      // If original is empty, check if current form has any meaningful data
      return !!(
        form.name ||
        form.education ||
        form.bio ||
        form.interests?.length > 0 ||
        form.skills?.length > 0
      );
    }

    // Compare all form fields
    const fieldsToCompare = [
      "name",
      "email",
      "education",
      "bio",
      "customInterest",
      "customSkill",
      "profilePicture",
    ];

    // Check simple fields
    for (const field of fieldsToCompare) {
      if (form[field] !== originalForm[field]) {
        return true;
      }
    }

    // Compare arrays (interests, skills, profilePictures)
    const compareArrays = (arr1, arr2) => {
      if (arr1.length !== arr2.length) return true;
      const sorted1 = [...arr1].sort();
      const sorted2 = [...arr2].sort();
      return JSON.stringify(sorted1) !== JSON.stringify(sorted2);
    };

    if (compareArrays(form.interests || [], originalForm.interests || [])) {
      return true;
    }

    if (compareArrays(form.skills || [], originalForm.skills || [])) {
      return true;
    }

    // Compare profilePictures (check if profile picture changed)
    const currentProfilePic =
      form.profilePictures?.find((pic) => pic.isProfile)?.path ||
      form.profilePicture;
    const originalProfilePic =
      originalForm.profilePictures?.find((pic) => pic.isProfile)?.path ||
      originalForm.profilePicture;
    if (currentProfilePic !== originalProfilePic) {
      return true;
    }

    return false;
  };

  const handleSave = async () => {
    if (!currentUser || !currentUser.email) {
      setToast({
        message: "Please log in to save your profile",
        type: "error",
      });
      return;
    }

    // Check if there are any changes
    if (!hasChanges()) {
      setToast({
        message: "No changes made",
        type: "info",
      });
      return;
    }

    setSaving(true);

    try {
      // Sanitize all user inputs before saving
      const userData = sanitizeProfile({
        full_name: form.name,
        email_address: form.email || currentUser.email,
        // Never store password - removed for security
        gender: currentUser.gender || "",
        country: currentUser.country || "",
        year: currentUser.year || "",
        education: form.education,
        interests: form.interests,
        custom_interest: form.customInterest,
        skills: form.skills,
        custom_skill: form.customSkill,
        profile_picture: form.profilePicture,
        profilePictures: form.profilePictures,
        bio: form.bio,
        recommendations_saved: currentUser.recommendations_saved || [],
        recommendations_selected: currentUser.recommendations_selected || [],
        recommendations_rejected: currentUser.recommendations_rejected || [],
      });

      const nameChanged = originalName && originalName !== form.name;
      const oldName = nameChanged ? originalName : null;

      // Save with improved timeout logic
      let saved;
      try {
        const savePromise = saveUserDataDual(userData, oldName);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Save operation timed out")), 2000)
        );

        saved = await Promise.race([savePromise, timeoutPromise]);
      } catch (error) {
        console.error("Save error:", error);
        // Check if data was actually saved to localStorage despite error
        try {
          const checkUser = getCurrentUser();
          const storageKey = `user_json_${form.name || checkUser?.name}`;
          const savedData = localStorage.getItem(storageKey);

          if (savedData) {
            // Data was saved, treat as success
            saved = {
              success: true,
              message: "Profile saved (may not have synced to server)",
            };
          } else {
            saved = {
              success: false,
              message: error.message || "Failed to save profile",
            };
          }
        } catch (checkError) {
          // If even checking fails, assume failure
          saved = {
            success: false,
            message: error.message || "Failed to save profile",
          };
        }
      }

      // Check if save was successful
      if (saved && saved.success !== false) {
        setOriginalName(form.name);

        // Update originalForm to current form after successful save
        setOriginalForm(JSON.parse(JSON.stringify(form)));

        const updatedUser = {
          ...currentUser,
          name: form.name,
          avatar: form.profilePicture
            ? form.profilePicture.replace("Faces/", "")
            : currentUser.avatar,
        };
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));

        setToast({ message: "Changes saved successfully", type: "success" });

        // Notify parent component of profile update
        if (onProfileUpdate) {
          onProfileUpdate();
        }
      } else {
        setToast({
          message:
            saved?.message || "Failed to save profile. Please try again.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      setToast({
        message: "An error occurred while saving your profile.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="card p-6 text-center">
        <div className="text-muted">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="profile-tab-container">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Edit Profile</h2>
          <button
            className="save-profile-btn transition-all duration-150 ease-in-out transform hover:scale-105 active:scale-95 active:shadow-md"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>

        {/* Profile Picture Section with Album */}
        <div className="profile-picture-section mb-6">
          <div className="flex items-center gap-6 mb-4">
            <div className="profile-picture-container group relative">
              {profileImagePreview ? (
                <img
                  src={profileImagePreview}
                  alt="Profile"
                  className="profile-picture-main rounded-full object-cover"
                />
              ) : (
                <div className="profile-picture-placeholder rounded-full flex items-center justify-center">
                  No Image
                </div>
              )}
              <div className="profile-picture-overlay">
                <span className="text-sm font-medium">Change Picture</span>
              </div>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Upload profile picture"
              />
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Profile Picture</h3>
              <p className="text-sm text-muted mb-3">
                Upload a new picture or select from your album
              </p>
              <button
                className="btn-secondary transition-all duration-150 ease-in-out transform hover:scale-105 active:scale-95 active:shadow-md"
                onClick={() => setShowAlbum(!showAlbum)}
              >
                {showAlbum ? "Hide Album" : "View Album"} (
                {form.profilePictures.length})
              </button>
            </div>
          </div>

          {/* Album Gallery */}
          {showAlbum && (
            <div className="album-gallery">
              <h4 className="text-md font-semibold mb-3">Your Photos</h4>
              {form.profilePictures.length > 0 ? (
                <div className="album-grid">
                  {form.profilePictures.map((pic, index) => (
                    <div
                      key={index}
                      className={`album-thumbnail ${
                        pic.isProfile ? "active" : ""
                      } transition-all duration-150 ease-in-out transform hover:scale-110 active:scale-95 active:shadow-md`}
                      onClick={() => setProfilePictureFromAlbum(pic.path)}
                    >
                      {(() => {
                        const imageData = localStorage.getItem(
                          `profile_image_${pic.path.replace("Faces/", "")}`
                        );
                        if (imageData) {
                          const parsed = JSON.parse(imageData);
                          return (
                            <img src={parsed.data} alt={`Photo ${index + 1}`} />
                          );
                        }
                        const imageUrl = getAvatarUrl(
                          pic.path.replace("Faces/", "")
                        );
                        return (
                          <img src={imageUrl} alt={`Photo ${index + 1}`} />
                        );
                      })()}
                      {pic.isProfile && (
                        <div className="album-badge">Current</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-sm">
                  No photos in album yet. Upload your first picture!
                </p>
              )}
            </div>
          )}
        </div>

        {/* My Profile Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">My Profile</h3>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <input
              className="input flex-1"
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="input flex-1 text-gray-700"
              placeholder="Email address"
              value={form.email}
              disabled
            />
          </div>
          <select
            className="select w-full"
            value={form.education}
            onChange={(e) => setForm({ ...form, education: e.target.value })}
          >
            <option value="">Select Education (HSC / Diploma / BSc)</option>
            {fields.education.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </div>

        {/* Interests Section with Inline Tags */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Interests</h3>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {form.interests.map((interest, index) => (
              <span
                key={index}
                className="tag-chip tag-chip-active transition-all duration-150 ease-in-out transform hover:scale-105 active:scale-95 active:shadow-md"
              >
                {interest}
                <button
                  className="tag-remove"
                  onClick={() => removeTag("interests", interest)}
                  aria-label="Remove interest"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {fields.interests.slice(0, 6).map((x) => (
              <button
                key={x}
                className={`tag-chip transition-all duration-150 ease-in-out transform hover:scale-105 active:scale-95 active:shadow-md ${
                  form.interests.includes(x) ? "tag-chip-active" : ""
                }`}
                type="button"
                onClick={() => toggle("interests", x)}
              >
                {x}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Custom interest (type your own)"
              value={form.customInterest}
              onChange={(e) =>
                setForm({ ...form, customInterest: e.target.value })
              }
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  addCustomTag("interests", "customInterest");
                }
              }}
            />
            <button
              className="btn-secondary transition-all duration-150 ease-in-out transform hover:scale-105 active:scale-95 active:shadow-md"
              onClick={() => addCustomTag("interests", "customInterest")}
            >
              Add
            </button>
          </div>
        </div>

        {/* Skills Section with Inline Tags */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Skills</h3>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {form.skills.map((skill, index) => (
              <span
                key={index}
                className="tag-chip tag-chip-active transition-all duration-150 ease-in-out transform hover:scale-105 active:scale-95 active:shadow-md"
              >
                {skill}
                <button
                  className="tag-remove"
                  onClick={() => removeTag("skills", skill)}
                  aria-label="Remove skill"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {fields.skills.slice(0, 8).map((x) => (
              <button
                key={x}
                className={`tag-chip transition-all duration-150 ease-in-out transform hover:scale-105 active:scale-95 active:shadow-md ${
                  form.skills.includes(x) ? "tag-chip-active" : ""
                }`}
                type="button"
                onClick={() => toggle("skills", x)}
              >
                {x}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Custom skill (type your own)"
              value={form.customSkill}
              onChange={(e) =>
                setForm({ ...form, customSkill: e.target.value })
              }
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  addCustomTag("skills", "customSkill");
                }
              }}
            />
            <button
              className="btn-secondary transition-all duration-150 ease-in-out transform hover:scale-105 active:scale-95 active:shadow-md"
              onClick={() => addCustomTag("skills", "customSkill")}
            >
              Add
            </button>
          </div>
        </div>

        {/* Bio Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Describe Myself</h3>
          <textarea
            className="input w-full min-h-[120px] resize-y font-inherit"
            placeholder="Write about yourself, your experience, goals, etc."
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
