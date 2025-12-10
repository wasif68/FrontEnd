/**
 * Share Page
 *
 * Displays shared job or course details based on share token
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "@/config/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import ErrorBoundary from "@/components/ErrorBoundary";
import "./SharePage.css";

export default function SharePage() {
  const { type, token } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSharedItem = async () => {
      try {
        setLoading(true);

        if (type !== "job" && type !== "course") {
          throw new Error("Invalid share type");
        }

        // Find the shared item by token
        const sharedItemsRef = collection(db, "shared_items");
        const q = query(
          sharedItemsRef,
          where("item_type", "==", type),
          where("share_token", "==", token)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          throw new Error("Share link not found or expired");
        }

        const shareItem = querySnapshot.docs[0].data();

        // Get the actual item (job or course)
        if (type === "job") {
          const jobDoc = await getDoc(
            doc(db, "careers", shareItem.item_id.toString())
          );
          if (!jobDoc.exists()) {
            throw new Error("Job not found");
          }
          setItem({
            ...jobDoc.data(),
            id: jobDoc.id,
          });
        } else {
          const courseDoc = await getDoc(
            doc(db, "courses", shareItem.item_id.toString())
          );
          if (!courseDoc.exists()) {
            throw new Error("Course not found");
          }
          setItem({
            ...courseDoc.data(),
            id: courseDoc.id,
          });
        }
      } catch (err) {
        console.error("Error loading shared item:", err);
        setError(err.message || "Failed to load shared item");
      } finally {
        setLoading(false);
      }
    };

    if (type && token) {
      loadSharedItem();
    } else {
      setError("Invalid share link");
      setLoading(false);
    }
  }, [type, token]);

  if (loading) {
    return (
      <div className="share-page-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="share-page-container">
        <div className="error-state">
          <h2>Error</h2>
          <p>{error || "Item not found"}</p>
          <button onClick={() => navigate("/login")} className="btn-primary">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary message="An error occurred loading the shared item.">
      <div className="share-page-container">
        <div className="shared-item-card">
          <h1 className="item-title">{item.title}</h1>

          {type === "job" ? (
            <>
              <p className="item-company">{item.company}</p>
              <p className="item-location">{item.location}</p>
              {item.description && (
                <div className="item-description">
                  <h3>Description</h3>
                  <p>{item.description}</p>
                </div>
              )}
              {item.skills && item.skills.length > 0 && (
                <div className="item-skills">
                  <h3>Required Skills</h3>
                  <div className="skills-list">
                    {item.skills.map((skill, index) => (
                      <span key={index} className="skill-tag">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="item-provider">{item.provider}</p>
              <p className="item-location">{item.location}</p>
              {item.description && (
                <div className="item-description">
                  <h3>Description</h3>
                  <p>{item.description}</p>
                </div>
              )}
              {item.skills && item.skills.length > 0 && (
                <div className="item-skills">
                  <h3>Skills Covered</h3>
                  <div className="skills-list">
                    {item.skills.map((skill, index) => (
                      <span key={index} className="skill-tag">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="share-actions">
            <button onClick={() => navigate("/login")} className="btn-primary">
              Sign In to {type === "job" ? "Apply" : "Enroll"}
            </button>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
