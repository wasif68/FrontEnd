/**
 * Toast Notification Component
 */

import { useEffect, useState, useRef } from "react";
import "./Toast.css";

export default function Toast({ message, type = "success", onClose, duration = 3000 }) {
  const [isVisible, setIsVisible] = useState(true);
  const fadeTimerRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Store fade timer in ref so we can clean it up
      fadeTimerRef.current = setTimeout(() => {
        onClose?.();
      }, 300);
    }, duration);

    return () => {
      clearTimeout(timer);
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
      }
    };
  }, [duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className={`toast toast-${type} ${isVisible ? "toast-show" : "toast-hide"}`}>
      <div className="toast-content">
        <span className="toast-icon">
          {type === "success" ? "✓" : type === "error" ? "✕" : "ℹ"}
        </span>
        <span className="toast-message">{message}</span>
      </div>
      <button className="toast-close" onClick={() => setIsVisible(false)}>
        ×
      </button>
    </div>
  );
}

