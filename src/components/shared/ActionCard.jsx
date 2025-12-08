/**
 * Action Card Component (Reusable)
 * 
 * Generic card component for both jobs and courses
 * Supports Apply/Enroll, Save, and Share actions
 */

import React from "react";

export default function ActionCard({
  id,
  title,
  subtitle, // company or provider
  location,
  description,
  skills = [],
  matchPercentage,
  type = "job", // 'job' or 'course'
  actionLabel = "Apply", // 'Apply' or 'Enroll'
  onApply,
  onSave,
  onShare,
  isApplied = false,
  isSaved = false,
  matchPercentageColor = null, // Optional override for match badge color
}) {
  const getMatchColor = () => {
    if (matchPercentageColor) return matchPercentageColor;
    if (matchPercentage >= 70) return "high";
    if (matchPercentage >= 40) return "medium";
    return "low";
  };

  return (
    <div className={`job-card transition-all duration-150 ease-in-out transform hover:scale-102 active:scale-95 active:shadow-md ${isSaved ? 'saved' : ''}`}>
      {/* Header */}
      <div className="job-card-header">
        <div className="job-card-main">
          <h3 className="job-title">{title}</h3>
          <div className="job-company">
            <span className="company-name">{subtitle}</span>
          </div>
          <div className="job-location">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            {location}
          </div>
        </div>
        
        {/* Match Score Badge (if matchPercentage provided) */}
        {matchPercentage !== undefined && (
          <div className={`match-badge match-${getMatchColor()}`}>
            <div className="match-score">{matchPercentage}%</div>
            <div className="match-label">Match</div>
          </div>
        )}
      </div>

      {/* Match Progress Bar (if matchPercentage provided) */}
      {matchPercentage !== undefined && (
        <div className="match-progress">
          <div 
            className="match-progress-bar" 
            style={{ width: `${matchPercentage}%` }}
          />
        </div>
      )}

      {/* Description */}
      <p className="job-description">{description}</p>

      {/* Skills Tags */}
      {skills.length > 0 && (
        <div className="job-skills">
          {skills.map((skill, index) => (
            <span key={index} className="skill-tag">
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="job-actions">
        {isSaved ? (
          <button
            className="btn-action saved-btn transition-all duration-150 ease-in-out transform hover:scale-105 active:scale-95 active:shadow-md"
            onClick={() => onSave && onSave(id, false)}
            aria-label={`Unsave ${type}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
            </svg>
            Saved
          </button>
        ) : (
          <button
            className="btn-action transition-all duration-150 ease-in-out transform hover:scale-105 active:scale-95 active:shadow-md"
            onClick={() => onSave && onSave(id, true)}
            aria-label={`Save ${type}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
            Save
          </button>
        )}
        
        <button
          className="btn-action transition-all duration-150 ease-in-out transform hover:scale-105 active:scale-95 active:shadow-md"
          onClick={() => onShare && onShare(id)}
          aria-label={`Share ${type}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
          </svg>
          Share
        </button>
        
        {isApplied ? (
          <button
            className="btn-action primary saved-btn transition-all duration-150 ease-in-out transform hover:scale-105 active:scale-95 active:shadow-md"
            disabled
            aria-label={`Already ${actionLabel.toLowerCase()}ed`}
          >
            {actionLabel}ed
          </button>
        ) : (
          <button
            className="btn-action primary transition-all duration-150 ease-in-out transform hover:scale-105 active:scale-95 active:shadow-md"
            onClick={() => onApply && onApply(id)}
            aria-label={actionLabel}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

