'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedProgressBarProps {
  value: number;
  max: number;
  isLeading?: boolean; // Leading option gets Discord purple, trailing gets muted
  delay?: number; // Stagger animation delay in ms
  className?: string;
  showPercentage?: boolean;
}

export default function AnimatedProgressBar({
  value,
  max,
  isLeading = false,
  delay = 0,
  className,
  showPercentage = false,
}: AnimatedProgressBarProps) {
  const [animate, setAnimate] = useState(false);
  const percentage = max > 0 ? (value / max) * 100 : 0;

  // Trigger animation after delay for staggered effect
  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={cn(
        'w-full bg-neutral-300 dark:bg-neutral-700 rounded-full h-3 overflow-hidden relative',
        className
      )}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={`Progress: ${Math.round(percentage)}%`}
    >
      <div
        className={cn(
          'h-full rounded-full transition-all ease-out',
          isLeading
            ? 'bg-primary'
            : 'bg-primary-light/50 dark:bg-primary-light/30',
          animate ? 'duration-[800ms]' : 'duration-0' // 800ms for smooth animation
        )}
        style={{
          width: animate ? `${percentage}%` : '0%',
        }}
      />
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-foreground drop-shadow-lg">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
}
