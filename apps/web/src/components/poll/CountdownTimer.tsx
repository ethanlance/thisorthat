'use client';

import { useState, useEffect } from 'react';
import {
  calculateTimeLeft,
  formatTimeLeft,
  getExpirationWarningLevel,
  TimeLeft,
} from '@/lib/services/expiration';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  expiresAt: string;
  onExpire?: () => void;
  className?: string;
  showSeconds?: boolean;
  compact?: boolean;
}

export default function CountdownTimer({
  expiresAt,
  onExpire,
  className,
  showSeconds = true,
  compact = false,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const calculated = calculateTimeLeft(expiresAt);

      if (!calculated) {
        setTimeLeft(null);
        setIsExpired(true);
        onExpire?.();
        return;
      }

      setTimeLeft(calculated);
      setIsExpired(false);
    };

    // Update immediately
    updateTimer();

    // Update every second
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  if (isExpired) {
    return (
      <div
        className={cn(
          'text-red-600 dark:text-red-400 font-medium',
          compact ? 'text-sm' : 'text-base',
          className
        )}
      >
        Expired
      </div>
    );
  }

  if (!timeLeft) {
    return (
      <div
        className={cn(
          'text-gray-500 dark:text-gray-400',
          compact ? 'text-sm' : 'text-base',
          className
        )}
      >
        Calculating...
      </div>
    );
  }

  const warningLevel = getExpirationWarningLevel(timeLeft);
  const formattedTime = formatTimeLeft(timeLeft);

  const getWarningStyles = () => {
    switch (warningLevel) {
      case 'critical':
        return 'text-red-600 dark:text-red-400 animate-pulse';
      case 'warning':
        return 'text-orange-600 dark:text-orange-400';
      default:
        return 'text-gray-700 dark:text-gray-300';
    }
  };

  if (compact) {
    return (
      <div className={cn('font-medium', getWarningStyles(), className)}>
        {formattedTime}
      </div>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      <div className={cn('font-medium', getWarningStyles())}>
        {formattedTime}
      </div>

      {warningLevel !== 'none' && (
        <div
          className={cn(
            'text-xs',
            warningLevel === 'critical'
              ? 'text-red-500 dark:text-red-400'
              : 'text-orange-500 dark:text-orange-400'
          )}
        >
          {warningLevel === 'critical' ? 'Expires soon!' : 'Expiring soon'}
        </div>
      )}
    </div>
  );
}
