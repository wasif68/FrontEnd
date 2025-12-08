/**
 * exampleIntegration.jsx
 * 
 * Demonstrates resilient data fetching and integration with the data-agnostic
 * RadialProgressBar component, including responsive layout and smooth refresh.
 */
import React from 'react';
import { calculateProfileCompletion } from './calculateProfileCompletion';
import RadialProgressBar from './RadialProgressBar';
import './exampleIntegration.css';

const ProfileCompletionWidget = ({ profileData, loading, error }) => {
  if (loading) {
    return <div className="widget-container"><p>Loading completion data...</p></div>;
  }

  if (error) {
    return <div className="widget-container error-message">Error: {error}</div>;
  }

  if (!profileData) {
    return <div className="widget-container"><p>No profile data available for completion calculation.</p></div>;
  }

  const { user = {}, enrolledCourses = [], savedCourses = [], appliedJobs = [], savedJobs = [] } = profileData;

  // Calculate skill progress (deterministic hash - same as SkillsTab.jsx)
  const getSkillProgress = (skill) => {
    // Create a deterministic hash from skill name
    let hash = 0;
    for (let i = 0; i < skill.length; i++) {
      const char = skill.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    // Use hash to generate consistent progress (60-100%)
    const baseProgress = 60 + (Math.abs(hash) % 41);
    return baseProgress;
  };

  // Parse skills_selected and transform to objects with progress field
  let userSkills = [];
  if (user.skills_selected && user.skills_selected.trim && user.skills_selected.trim() !== '') {
    try {
      const skillsArray = typeof user.skills_selected === 'string' 
        ? JSON.parse(user.skills_selected) 
        : user.skills_selected;
      
      // Transform array of strings to array of objects with progress
      userSkills = Array.isArray(skillsArray) && skillsArray.length > 0
        ? skillsArray.map(skill => {
            const skillName = typeof skill === 'string' ? skill : (skill?.name || skill || '');
            return {
              name: skillName,
              progress: typeof skill === 'object' && skill?.progress !== undefined 
                ? skill.progress 
                : getSkillProgress(skillName)
            };
          })
        : [];
    } catch (e) {
      console.error("Error parsing skills_selected:", e);
      userSkills = [];
    }
  }

  const combinedData = {
    courses: enrolledCourses, // calculateProfileCompletion expects 'courses' to be enrolledCourses
    jobs: {
      appliedJobs: appliedJobs,
      savedJobs: savedJobs,
    },
    skills: userSkills,
  };

  const calculatedPercentages = calculateProfileCompletion(combinedData);

  const totalProfileCompletion = user.completion_percentage || 0;

  const rings = [
    { name: 'profile', percentage: totalProfileCompletion, color: '#FFC107', radius: 140 }, // Added profile ring
    { name: 'courses', percentage: calculatedPercentages.courses, color: '#00C49F', radius: 115 },
    { name: 'jobs', percentage: calculatedPercentages.jobs, color: '#0088FE', radius: 90 },
    { name: 'skills', percentage: calculatedPercentages.skills, color: '#FF8042', radius: 65 },
  ];

  return (
    <div className="widget-container">
      <h2 className="widget-title">Profile Completion</h2>
      
      <div className="progress-chart-container">
        <RadialProgressBar total={totalProfileCompletion} rings={rings} />
      </div>
    </div>
  );
};

export default ProfileCompletionWidget;
