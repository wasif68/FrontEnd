/**
 * calculateProfileCompletion.js
 * 
 * Computes completion percentages for different profile sections
 * and a weighted total completion score, with refined mastery logic.
 */

/**
 * Calculates the completion percentages based on user profile data.
 * @param {object} data - An object containing arrays for courses, jobs, and skills.
 * @param {Array} [data.courses=[]] - User's enrolled courses.
 * @param {object} [data.jobs={}] - Object with appliedJobs and savedJobs arrays.
 * @param {Array} [data.skills=[]] - User's skills with progress.
 * @returns {object} - An object with total, courses, jobs, and skills percentages.
 */
export const calculateProfileCompletion = (data) => {
  const { courses = [], jobs = {}, skills = [] } = data;
  const { appliedJobs = [], savedJobs = [] } = jobs;

  // 1. Courses: Percentage of enrolled courses that are 'completed'.
  const totalEnrolledCourses = courses.length;
  const completedCourses = courses.filter(c => c.status === 'completed').length;
  const coursesPercentage = totalEnrolledCourses > 0 
    ? Math.round((completedCourses / totalEnrolledCourses) * 100) 
    : 0;

  // 2. Jobs: Percentage of jobs applied for out of all (applied + saved).
  const totalJobs = appliedJobs.length + savedJobs.length;
  const jobsPercentage = totalJobs > 0 
    ? Math.round((appliedJobs.length / totalJobs) * 100) 
    : 0;

  // 3. Skills: Percentage of skills considered "mastered" (progress > 90%).
  const totalSkills = skills.length;
  const masteredSkills = skills.filter(s => s.progress > 90).length;
  const skillsPercentage = totalSkills > 0 
    ? Math.round((masteredSkills / totalSkills) * 100) 
    : 0;

  // 4. Total (Weighted Average): Courses (40%), Jobs (30%), Skills (30%).
  const totalPercentage = Math.round(
    (coursesPercentage * 0.4) + (jobsPercentage * 0.3) + (skillsPercentage * 0.3)
  );

  return {
    total: totalPercentage,
    courses: coursesPercentage,
    jobs: jobsPercentage,
    skills: skillsPercentage,
  };
};
