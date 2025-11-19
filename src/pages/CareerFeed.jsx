/**
 * Career Feed Page Component (Home/Recommendations)
 *
 * This page displays personalized career recommendations:
 * - Shows list of career opportunities matched to user's profile
 * - Scores each career based on user's skills and interests
 * - Allows users to save interesting careers for later
 * - Displays career details: title, company, location, description, required skills
 * - Shows matching score and reason for recommendation
 * - Provides actions: Save, Not interested, View details
 *
 * Part of the app: Career recommendations system
 * UI location: Main content area (protected route, home page)
 * Manages: Career matching algorithm, saved items, recommendation display
 */

import { useEffect, useMemo, useState } from "react";
import catalog from "../data/careers_bd.json";
import { getProfile, getSavedItems, saveSavedItems } from "../utils/storage";
import { findOverlap, containsAny } from "../utils/helpers";
import { getCurrentUser } from "../services/authService.js";
import { loadUserJson, saveUserDataDual } from "../utils/userStorage.js";

export default function CareerFeed() {
  const profile = useMemo(() => getProfile(), []);
  const [saved, setSaved] = useState(() => getSavedItems());

  // Save saved items to localStorage whenever they change
  useEffect(() => {
    saveSavedItems(saved);
    
    // Also sync saved recommendations to user JSON (complete overwrite)
    const syncSavedToJson = async () => {
      const currentUser = getCurrentUser();
      if (currentUser && currentUser.name) {
        const userJson = await loadUserJson(currentUser.name);
        if (userJson) {
          // Get career titles for saved items
          const savedCareerTitles = Array.from(saved)
            .map((id) => {
              const career = catalog.find((c) => c.id === id);
              return career ? career.title : null;
            })
            .filter(Boolean);
          
          // COMPLETE OVERWRITE - Replace recommendations_selected
          const updatedData = {
            ...userJson,
            recommendations_selected: savedCareerTitles, // Complete replacement
            recommendations_saved: Array.from(saved), // Keep IDs for backward compatibility
          };
          
          await saveUserDataDual(updatedData);
        }
      }
    };
    
    const timeoutId = setTimeout(syncSavedToJson, 500);
    return () => clearTimeout(timeoutId);
  }, [saved]);

  // Score careers based on user profile
  const scored = catalog
    .map((c) => {
      const skillHits = findOverlap(profile.skills, c.skills).length;
      const title = c.title.toLowerCase();
      const interestHits = containsAny(title, profile.interests || []) ? 1 : 0;
      const score = skillHits * 2 + interestHits;
      return { ...c, score, skillHits };
    })
    .sort((a, b) => b.score - a.score);

  return (
    <div className="feed">
      <div className="card">
        <h2>Recommended Careers</h2>
        <div style={{ color: "#8896ab" }}>
          Matched from your profile skills and interests.
        </div>
      </div>
      {scored.map((job) => (
        <div key={job.id} className="card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "start",
            }}
          >
            <div>
              <h3 style={{ margin: "4px 0" }}>{job.title}</h3>
              <div style={{ color: "#8896ab" }}>
                {job.company} • {job.location}
              </div>
            </div>
            <div style={{ color: "#8896ab" }}>
              Score: <strong>{job.score}</strong>
            </div>
          </div>
          <p style={{ marginTop: 9 }}>{job.description}</p>
          <div className="tags">
            {job.skills.map((s) => (
              <span className="tag" key={s}>
                {s}
              </span>
            ))}
          </div>
          <div className="actions">
            <button
              className="btn"
              onClick={() => setSaved((prev) => new Set(prev).add(job.id))}
            >
              {saved.has(job.id) ? "Saved" : "Save"}
            </button>
            <button className="btn">Not interested</button>
            <button
              className="btn primary"
              onClick={() => alert("Details page coming soon")}
            >
              View details
            </button>
          </div>
          {job.skillHits > 0 && (
            <div style={{ marginTop: 9, color: "#8896ab", fontSize: 14 }}>
              Reason: matched skills{" "}
              {findOverlap(profile.skills, job.skills).join(", ")}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
