'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  calculateTimeLeft,
  getExpirationWarningLevel,
} from '@/lib/services/expiration';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpirationWarningProps {
  expiresAt: string;
  className?: string;
  showIcon?: boolean;
  compact?: boolean;
}

export default function ExpirationWarning({
  expiresAt,
  className,
  showIcon = true,
  compact = false,
}: ExpirationWarningProps) {
  const timeLeft = calculateTimeLeft(expiresAt);

  if (!timeLeft) {
    return null;
  }

  const warningLevel = getExpirationWarningLevel(timeLeft);

  if (warningLevel === 'none') {
    return null;
  }

  const getWarningConfig = () => {
    switch (warningLevel) {
      case 'critical':
        return {
          icon: AlertCircle,
          message: 'This poll expires in less than 5 minutes!',
          variant: 'destructive' as const,
          className:
            'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          message: 'This poll expires in less than 30 minutes.',
          variant: 'default' as const,
          className:
            'border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
        };
      default:
        return null;
    }
  };

  const config = getWarningConfig();

  if (!config) {
    return null;
  }

  const Icon = config.icon;

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 text-sm font-medium',
          config.className,
          className
        )}
      >
        {showIcon && <Icon className="h-4 w-4" />}
        <span>{config.message}</span>
      </div>
    );
  }

  return (
    <Alert variant={config.variant} className={cn(config.className, className)}>
      {showIcon && <Icon className="h-4 w-4" />}
      <AlertDescription className="font-medium">
        {config.message}
      </AlertDescription>
    </Alert>
  );
}
