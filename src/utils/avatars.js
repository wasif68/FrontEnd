/**
 * Avatar Utility Functions
 *
 * This file manages avatar images used for user profiles:
 * - Dynamically imports all avatar images from the '@/assets/faces' directory.
 * - Provides helper functions to get avatar URLs.
 * - Returns random avatar file names based on gender.
 *
 * Part of the app: User profile visuals
 * Manages: Avatar selection, gender-based avatar assignment
 */

// Vite's import.meta.glob feature for dynamic imports
// Note: This is a Vite-specific feature and won't work in a pure Node.js environment.
// It creates a map of module paths to their dynamic import functions.
const avatarModules = import.meta.glob('@/assets/faces/*.{jpg,jpeg,png,svg}');

// Create the avatar catalog from the imported modules
const avatarCatalog = Object.entries(avatarModules).map(([path, importer]) => {
  const file = path.split('/').pop();
  const gender = file.toLowerCase().includes('female') ? 'female' : 'male';
  
  // In a development environment, the `importer` is a function that returns a Promise resolving to the module URL.
  // In a production build, the URLs are statically analyzed and replaced.
  // For simplicity and to ensure compatibility with how Vite handles assets,
  // we can use a helper to get the static URL.
  const url = new URL(path, import.meta.url).href;

  return { file, gender, url };
});

const defaultAvatar = avatarCatalog.length > 0 ? avatarCatalog[0] : { url: '' };

/**
 * Get the URL for a given avatar file name
 * @param {string} fileName - Avatar file name stored in CSV/localStorage
 * @returns {string} - Resolved image URL
 */
export const getAvatarUrl = (fileName) => {
  if (!fileName) return defaultAvatar.url;
  const match = avatarCatalog.find((avatar) => avatar.file === fileName);
  return match ? match.url : defaultAvatar.url;
};

/**
 * Get a random avatar file name based on gender
 * @param {string} gender - User's gender (male/female/other)
 * @returns {string} - Avatar file name
 */
export const getRandomAvatarFile = (gender = 'other') => {
  const normalizedGender = gender?.toLowerCase();
  const genderSpecific = avatarCatalog.filter(
    (avatar) => avatar.gender === normalizedGender
  );
  const pool = genderSpecific.length ? genderSpecific : avatarCatalog;
  if (pool.length === 0) return '';
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex].file;
};

/**
 * Ensure user object has avatar fields populated
 * @param {Object} user - User object that may or may not have avatar info
 * @returns {Object} - User object with avatar and avatarUrl properties
 */
export const withAvatarMetadata = (user = {}) => {
  if (!user) return user;
  const fileName = user.avatar || getRandomAvatarFile(user.gender);
  return {
    ...user,
    avatar: fileName,
    avatarUrl: getAvatarUrl(fileName),
  };
};