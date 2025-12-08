/**
 * RadialProgressBar.jsx
 * 
 * A responsive, accessible, animated, data-agnostic, multi-ring 
 * radial progress bar component.
 */
import React, { useEffect, useState } from 'react';
import './RadialProgressBar.css';

// Custom hook for a smooth count-up animation
const useAnimatedValue = (targetValue, duration = 800) => {
  const [currentValue, setCurrentValue] = useState(0);
  useEffect(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3); // Easing out
      setCurrentValue(Math.floor(easedProgress * targetValue));
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }, [targetValue, duration]);
  return currentValue;
};

const ProgressRing = ({ radius, stroke, color, percentage, ringName, trackColor }) => {
  const circumference = 2 * Math.PI * radius;
  // Use a very small offset for 0% to prevent visual glitches in some browsers
  const offset = percentage > 0 ? circumference - (percentage / 100) * circumference : circumference - 0.001;

  return (
    <g>
      <title>{`${ringName.charAt(0).toUpperCase() + ringName.slice(1)}: ${percentage}%`}</title>
      {/* Track */}
      <circle cx="50%" cy="50%" r={radius} stroke={trackColor} strokeWidth={stroke} fill="transparent" />
      {/* Progress */}
      <circle
        className={`progress-ring-circle ${ringName}`}
        cx="50%"
        cy="50%"
        r={radius}
        stroke={percentage > 0 ? color : 'transparent'} // Hide progress if 0
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        fill="transparent"
      />
    </g>
  );
};

const RadialProgressBar = ({
  size = 250,
  strokeWidth = 20,
  total = 0,
  rings = [], // Now accepts a generic rings array
  colors = {
    total: '#FFFFFF',
    background: '#333A4C',
    track: 'rgba(255, 255, 255, 0.1)',
  }
}) => {
  // Delay the total animation until after the rings have started drawing
  const [isTotalVisible, setIsTotalVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsTotalVisible(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const animatedTotal = useAnimatedValue(isTotalVisible ? total : 0);
  
  const centerSize = size / 2;
  const accessibilityLabel = `Profile completion: ${total}%. ${rings.map(r => `${r.name}: ${r.percentage}%`).join('. ')}.`;

  return (
    <div className="radial-progress-bar-container" style={{ maxWidth: size }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} role="img" aria-label={accessibilityLabel}>
        <g transform={`rotate(-90 ${centerSize} ${centerSize})`}>
          {rings.map((ring) => (
            <ProgressRing
              key={ring.name}
              radius={ring.radius}
              stroke={strokeWidth}
              color={ring.color}
              percentage={ring.percentage}
              ringName={ring.name}
              trackColor={colors.track}
            />
          ))}
        </g>
      </svg>
      
      <div className="radial-progress-bar-center-text" style={{ color: colors.total }}>
        <span className="total-value">{animatedTotal}</span>
        <span className="symbol">%</span>
      </div>
    </div>
  );
};

export default RadialProgressBar;