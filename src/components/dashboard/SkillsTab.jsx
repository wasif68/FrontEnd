/**
 * Skills Tab Component (Enhanced)
 *
 * Displays skills with progress indicators, badges, and career path
 * Inspired by Coursera, Khan Academy, and GitHub
 */

import { useEffect, useState } from "react";
import fields from "@/data/profile_fields.json";
import { getCurrentUser } from "@/services/authService.js";
import { loadUserJson } from "@/utils/userStorage.js";
import "./SkillsTab.css";
import "./SkillsTab.css";

export default function SkillsTab() {
  const currentUser = getCurrentUser();
  const [skills, setSkills] = useState([]);
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const loadUserData = async () => {
      try {
        if (currentUser && currentUser.name) {
          // Add timeout to prevent hanging
          const loadPromise = loadUserJson(currentUser.name);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Load timeout")), 3000)
          );
          
          const userJson = await Promise.race([loadPromise, timeoutPromise]);
          
          if (userJson && isMounted) {
            setSkills(userJson.skills || []);
            setInterests(userJson.interests || []);
          }
        }
      } catch (error) {
        console.error("Error loading skills data:", error);
        // Set empty arrays on error
        if (isMounted) {
          setSkills([]);
          setInterests([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    loadUserData();
    
    return () => {
      isMounted = false;
    };
  }, [currentUser?.name]); // Only depend on name, not entire object

  // Calculate skill progress (simulated - in real app, this would track actual learning)
  // Use a deterministic hash instead of Math.random() to prevent re-renders
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

  // Get skill level badge
  const getSkillLevel = (progress) => {
    if (progress >= 90) return { label: "Expert", color: "#10b981", icon: "⭐" };
    if (progress >= 70) return { label: "Advanced", color: "#3b82f6", icon: "🎯" };
    if (progress >= 50) return { label: "Intermediate", color: "#f59e0b", icon: "📚" };
    return { label: "Beginner", color: "#6b7280", icon: "🌱" };
  };

  // Calculate achievements/badges
  const achievements = [
    { id: 1, name: "Skill Collector", icon: "🏆", description: "Added 5+ skills", earned: skills.length >= 5 },
    { id: 2, name: "Expert Level", icon: "⭐", description: "Mastered 3+ skills", earned: skills.filter(s => getSkillProgress(s) >= 90).length >= 3 },
    { id: 3, name: "Well-Rounded", icon: "🎯", description: "Skills in 3+ categories", earned: skills.length >= 3 },
    { id: 4, name: "Profile Complete", icon: "✅", description: "Complete profile", earned: skills.length > 0 && interests.length > 0 },
  ];

  if (loading) {
    return (
      <div className="card">
        <div style={{ textAlign: "center", padding: "40px" }}>
          Loading skills...
        </div>
      </div>
    );
  }

  const totalSkills = skills.length;
  const totalInterests = interests.length;
  const profileCompletion = Math.min(100, ((totalSkills + totalInterests) / 20) * 100);

  return (
    <div className="skills-container">
      {/* Header with Progress Overview */}
      <div className="skills-header card">
        <div className="skills-header-top">
          <div>
            <h2>Skills & Career Path</h2>
            <p className="skills-subtitle">Track your skill development and career progress</p>
          </div>
          <div className="overall-progress">
            <div className="progress-circle">
              <svg className="progress-ring" width="80" height="80">
                <circle
                  className="progress-ring-circle"
                  cx="40"
                  cy="40"
                  r="36"
                  strokeDasharray={`${2 * Math.PI * 36}`}
                  strokeDashoffset={`${2 * Math.PI * 36 * (1 - profileCompletion / 100)}`}
                />
              </svg>
              <div className="progress-text">
                <span className="progress-percentage">{Math.round(profileCompletion)}%</span>
                <span className="progress-label">Complete</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements/Badges Section */}
      <div className="card achievements-section">
        <h3 className="section-title">
          <span>🏆</span> Achievements
        </h3>
        <div className="achievements-grid">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`achievement-badge ${achievement.earned ? 'earned' : 'locked'}`}
            >
              <div className="achievement-icon">{achievement.icon}</div>
              <div className="achievement-info">
                <div className="achievement-name">{achievement.name}</div>
                <div className="achievement-desc">{achievement.description}</div>
              </div>
              {achievement.earned && (
                <div className="achievement-check">✓</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Skills with Progress */}
      <div className="card skills-section">
        <h3 className="section-title">
          <span>💼</span> Your Skills ({totalSkills})
        </h3>
        {skills.length > 0 ? (
          <div className="skills-list">
            {skills.map((skill, index) => {
              const progress = getSkillProgress(skill);
              const level = getSkillLevel(progress);
              return (
                <div key={index} className="skill-item">
                  <div className="skill-header">
                    <div className="skill-name-section">
                      <span className="skill-name">{skill}</span>
                      <span className="skill-level" style={{ color: level.color }}>
                        {level.icon} {level.label}
                      </span>
                    </div>
                    <span className="skill-percentage">{progress}%</span>
                  </div>
                  <div className="skill-progress-bar">
                    <div
                      className="skill-progress-fill"
                      style={{
                        width: `${progress}%`,
                        background: `linear-gradient(90deg, ${level.color} 0%, ${level.color}dd 100%)`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <p>No skills added yet. Add skills in the Profile tab to get started.</p>
          </div>
        )}
      </div>

      {/* Interests Section */}
      <div className="card interests-section">
        <h3 className="section-title">
          <span>🎯</span> Your Interests ({totalInterests})
        </h3>
        {interests.length > 0 ? (
          <div className="interests-grid">
            {interests.map((interest, index) => (
              <div key={index} className="interest-badge">
                {interest}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No interests added yet. Add interests in the Profile tab.</p>
          </div>
        )}
      </div>

      {/* Available Skills Reference */}
      <div className="card available-skills-section">
        <h3 className="section-title">
          <span>📚</span> Available Skills to Learn
        </h3>
        <div className="available-skills-grid">
          {fields.skills.map((skill) => {
            const isLearned = skills.includes(skill);
            return (
              <div
                key={skill}
                className={`available-skill ${isLearned ? 'learned' : ''}`}
              >
                {skill}
                {isLearned && <span className="learned-check">✓</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Career Path Suggestion */}
      <div className="card career-path-section">
        <h3 className="section-title">
          <span>🚀</span> Suggested Career Path
        </h3>
        <div className="career-path">
          <div className="path-step completed">
            <div className="step-icon">1</div>
            <div className="step-content">
              <div className="step-title">Profile Setup</div>
              <div className="step-desc">Complete your profile information</div>
            </div>
            <div className="step-check">✓</div>
          </div>
          <div className="path-step completed">
            <div className="step-icon">2</div>
            <div className="step-content">
              <div className="step-title">Add Skills</div>
              <div className="step-desc">Add at least 3 relevant skills</div>
            </div>
            <div className="step-check">✓</div>
          </div>
          <div className={`path-step ${skills.length >= 3 ? 'completed' : 'active'}`}>
            <div className="step-icon">3</div>
            <div className="step-content">
              <div className="step-title">Explore Careers</div>
              <div className="step-desc">Browse recommended job opportunities</div>
            </div>
            {skills.length >= 3 && <div className="step-check">✓</div>}
          </div>
          <div className={`path-step ${skills.length >= 5 ? 'active' : 'upcoming'}`}>
            <div className="step-icon">4</div>
            <div className="step-content">
              <div className="step-title">Apply & Grow</div>
              <div className="step-desc">Apply to jobs and continue learning</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
