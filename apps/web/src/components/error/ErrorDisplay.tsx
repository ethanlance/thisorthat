'use client';

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertTriangle,
  XCircle,
  Wifi,
  WifiOff,
  Clock,
  Shield,
  RefreshCw,
  Info,
  AlertCircle,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface ErrorDisplayProps {
  error: {
    message: string;
    code?: string;
    severity?: ErrorSeverity;
    timestamp?: string;
    context?: string;
    details?: Record<string, unknown>;
  };
  onRetry?: () => void;
  onDismiss?: () => void;
  showTimestamp?: boolean;
  showContext?: boolean;
  className?: string;
  variant?: 'inline' | 'card' | 'banner';
}

const severityConfig = {
  info: {
    icon: Info,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    title: 'Information',
  },
  warning: {
    icon: AlertCircle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    title: 'Warning',
  },
  error: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    title: 'Error',
  },
  critical: {
    icon: AlertTriangle,
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
    title: 'Critical Error',
  },
};

const networkErrorIcons = {
  offline: WifiOff,
  timeout: Clock,
  connection: Wifi,
  server: Shield,
};

export function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  showTimestamp = false,
  showContext = false,
  className,
  variant = 'inline',
}: ErrorDisplayProps) {
  const severity = error.severity || 'error';
  const config = severityConfig[severity];
  const Icon = config.icon;

  // Determine if this is a network-related error
  const isNetworkError =
    error.code?.includes('NETWORK') ||
    error.message.toLowerCase().includes('network') ||
    error.message.toLowerCase().includes('connection') ||
    error.message.toLowerCase().includes('offline');

  const NetworkIcon = isNetworkError ? networkErrorIcons.offline : null;

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const content = (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border',
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <div className="flex-shrink-0">
        {NetworkIcon ? (
          <NetworkIcon className={cn('h-5 w-5', config.color)} />
        ) : (
          <Icon className={cn('h-5 w-5', config.color)} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className={cn('font-medium text-sm', config.color)}>
            {config.title}
          </h4>
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-6 w-6 p-0 hover:bg-transparent"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <p className="text-sm text-muted-foreground mt-1">{error.message}</p>

        {showContext && error.context && (
          <p className="text-xs text-muted-foreground mt-1">
            Context: {error.context}
          </p>
        )}

        {showTimestamp && error.timestamp && (
          <p className="text-xs text-muted-foreground mt-1">
            {formatTimestamp(error.timestamp)}
          </p>
        )}

        {error.code && (
          <p className="text-xs text-muted-foreground mt-1">
            Error Code: {error.code}
          </p>
        )}

        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-3"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}
      </div>
    </div>
  );

  if (variant === 'banner') {
    return <div className="w-full">{content}</div>;
  }

  if (variant === 'card') {
    return (
      <Card className={cn('border-l-4', config.borderColor)}>
        <CardHeader className="pb-3">
          <CardTitle
            className={cn('text-sm flex items-center gap-2', config.color)}
          >
            <Icon className="h-4 w-4" />
            {config.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground mb-4">{error.message}</p>

          {showContext && error.context && (
            <p className="text-xs text-muted-foreground mb-2">
              Context: {error.context}
            </p>
          )}

          {showTimestamp && error.timestamp && (
            <p className="text-xs text-muted-foreground mb-2">
              {formatTimestamp(error.timestamp)}
            </p>
          )}

          {error.code && (
            <p className="text-xs text-muted-foreground mb-4">
              Error Code: {error.code}
            </p>
          )}

          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Default inline variant
  return content;
}

// Specialized error components for common scenarios
export function NetworkErrorDisplay({
  onRetry,
  onDismiss,
  className,
}: {
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <ErrorDisplay
      error={{
        message:
          "You're offline or have a poor connection. Please check your internet and try again.",
        code: 'NETWORK_ERROR',
        severity: 'warning',
        timestamp: new Date().toISOString(),
      }}
      onRetry={onRetry}
      onDismiss={onDismiss}
      className={className}
      variant="banner"
    />
  );
}

export function ServerErrorDisplay({
  onRetry,
  onDismiss,
  className,
}: {
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <ErrorDisplay
      error={{
        message:
          'Our servers are experiencing issues. Please try again in a few moments.',
        code: 'SERVER_ERROR',
        severity: 'error',
        timestamp: new Date().toISOString(),
      }}
      onRetry={onRetry}
      onDismiss={onDismiss}
      className={className}
      variant="banner"
    />
  );
}

export function ValidationErrorDisplay({
  errors,
  className,
}: {
  errors: string[];
  className?: string;
}) {
  if (errors.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      {errors.map((error, index) => (
        <ErrorDisplay
          key={index}
          error={{
            message: error,
            code: 'VALIDATION_ERROR',
            severity: 'warning',
          }}
          variant="inline"
        />
      ))}
    </div>
  );
}

// Toast-style error notification
export function ErrorToast({
  error,
  onDismiss,
  className,
}: {
  error: ErrorDisplayProps['error'];
  onDismiss: () => void;
  className?: string;
}) {
  const config = severityConfig[error.severity || 'error'];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 max-w-sm',
        'bg-background border rounded-lg shadow-lg p-4',
        'animate-in slide-in-from-right-full duration-300',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', config.color)} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{error.message}</p>
          {error.code && (
            <p className="text-xs text-muted-foreground mt-1">{error.code}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="h-6 w-6 p-0 flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

