/**
 * Avatar Utility Functions
 *
 * This file manages avatar images used for user profiles:
 * - Imports all avatar images
 * - Provides helper functions to get avatar URLs
 * - Returns random avatar file names based on gender
 *
 * Part of the app: User profile visuals
 * Manages: Avatar selection, gender-based avatar assignment
 */

import avatar01Female from '../assets/faces/01_female_2001.jpg.jpg'
import avatar02Male from '../assets/faces/02_male_1998.jpg.jpg'
import avatar03Male from '../assets/faces/03_male_1997.jpg.jpeg'
import avatar04Female from '../assets/faces/04_female_1987.jpg.jpeg'
import avatar05Female from '../assets/faces/5_female_1986.jpg.jpg'
import avatar06Male from '../assets/faces/06_male_1999.jpg.jpg'
import avatar07Female from '../assets/faces/07_female_2001.jpg.jpg'
import avatar08Male from '../assets/faces/08_male_1968.jpg.jpg'
import avatar09Male from '../assets/faces/09_male_1982.jpg.jpg'
import avatar10Male from '../assets/faces/10_male_19981.jpg.jpg'
import avatar11Male from '../assets/faces/11_male_1970.jpg.jpg'
import avatar12Female from '../assets/faces/12_female_1989.jpg.jpg'
import avatar12Male from '../assets/faces/12_male_2011.jpg.jpeg'

const avatarCatalog = [
  { file: '01_female_2001.jpg.jpg', gender: 'female', url: avatar01Female },
  { file: '02_male_1998.jpg.jpg', gender: 'male', url: avatar02Male },
  { file: '03_male_1997.jpg.jpeg', gender: 'male', url: avatar03Male },
  { file: '04_female_1987.jpg.jpeg', gender: 'female', url: avatar04Female },
  { file: '5_female_1986.jpg.jpg', gender: 'female', url: avatar05Female },
  { file: '06_male_1999.jpg.jpg', gender: 'male', url: avatar06Male },
  { file: '07_female_2001.jpg.jpg', gender: 'female', url: avatar07Female },
  { file: '08_male_1968.jpg.jpg', gender: 'male', url: avatar08Male },
  { file: '09_male_1982.jpg.jpg', gender: 'male', url: avatar09Male },
  { file: '10_male_19981.jpg.jpg', gender: 'male', url: avatar10Male },
  { file: '11_male_1970.jpg.jpg', gender: 'male', url: avatar11Male },
  { file: '12_female_1989.jpg.jpg', gender: 'female', url: avatar12Female },
  { file: '12_male_2011.jpg.jpeg', gender: 'male', url: avatar12Male },
]

const defaultAvatar = avatarCatalog[0]

/**
 * Get the URL for a given avatar file name
 * @param {string} fileName - Avatar file name stored in CSV/localStorage
 * @returns {string} - Resolved image URL
 */
export const getAvatarUrl = (fileName) => {
  if (!fileName) return defaultAvatar.url
  const match = avatarCatalog.find((avatar) => avatar.file === fileName)
  return match ? match.url : defaultAvatar.url
}

/**
 * Get a random avatar file name based on gender
 * @param {string} gender - User's gender (male/female/other)
 * @returns {string} - Avatar file name
 */
export const getRandomAvatarFile = (gender = 'other') => {
  const normalizedGender = gender?.toLowerCase()
  const genderSpecific = avatarCatalog.filter(
    (avatar) => avatar.gender === normalizedGender
  )
  const pool = genderSpecific.length ? genderSpecific : avatarCatalog
  const randomIndex = Math.floor(Math.random() * pool.length)
  return pool[randomIndex].file
}

/**
 * Ensure user object has avatar fields populated
 * @param {Object} user - User object that may or may not have avatar info
 * @returns {Object} - User object with avatar and avatarUrl properties
 */
export const withAvatarMetadata = (user = {}) => {
  if (!user) return user
  const fileName = user.avatar || getRandomAvatarFile(user.gender)
  return {
    ...user,
    avatar: fileName,
    avatarUrl: getAvatarUrl(fileName),
  }
}

