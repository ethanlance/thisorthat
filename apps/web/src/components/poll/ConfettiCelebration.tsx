'use client';

import { useEffect, useRef } from 'react';

interface ConfettiCelebrationProps {
  active: boolean;
  onComplete?: () => void;
}

/**
 * Confetti celebration animation that triggers after voting.
 * Uses canvas-confetti library with Discord-inspired colors.
 * Respects prefers-reduced-motion setting.
 */
export function ConfettiCelebration({
  active,
  onComplete,
}: ConfettiCelebrationProps) {
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (!active || hasTriggered.current) return;

    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReducedMotion) {
      onComplete?.();
      return;
    }

    // Mark as triggered to prevent re-firing
    hasTriggered.current = true;

    // Lazy load confetti library to keep initial bundle small
    import('canvas-confetti').then(confetti => {
      const colors = [
        '#5865F2', // Discord purple
        '#7289DA', // Light purple
        '#EB459E', // Pink accent
        '#FFFFFF', // White
      ];

      // Fire confetti
      confetti.default({
        particleCount: 30,
        spread: 70,
        origin: { x: 0.5, y: 0.6 },
        colors,
        gravity: 1,
        scalar: 1.2,
        drift: 0,
        ticks: 200, // ~2 seconds at 60fps
        startVelocity: 35,
        decay: 0.94,
      });

      // Call onComplete after animation finishes
      if (onComplete) {
        setTimeout(onComplete, 2000);
      }
    });
  }, [active, onComplete]);

  // No visual element, just triggers the animation
  return null;
}

export default ConfettiCelebration;
