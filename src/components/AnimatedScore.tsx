import React, { useEffect, useState } from 'react';

interface AnimatedScoreProps {
  value: number;
  className?: string;
}

export const AnimatedScore: React.FC<AnimatedScoreProps> = ({ value, className = '' }) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (displayValue === value) return;

    const startValue = displayValue;
    const diff = value - startValue;
    const duration = Math.min(600, Math.max(200, Math.abs(diff) * 20));
    const startTime = performance.now();

    let animationFrame: number;

    const updateCounter = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + diff * easeProgress);

      setDisplayValue(current);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(updateCounter);
      }
    };

    animationFrame = requestAnimationFrame(updateCounter);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, displayValue]);

  return (
    <span className={`tabular-nums font-mono font-black ${className}`}>
      {displayValue.toLocaleString()}
    </span>
  );
};
