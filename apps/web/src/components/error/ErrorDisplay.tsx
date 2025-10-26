'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  RefreshCw,
  WifiOff,
  Lock,
  Shield,
  FileText,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
  Bug,
} from 'lucide-react';
import { ErrorService } from '@/lib/error-handling/ErrorService';

interface ErrorDisplayProps {
  error: Error;
  context?: {
    component?: string;
    action?: string;
    metadata?: Record<string, unknown>;
  };
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
  className?: string;
}

interface ErrorToastProps {
  error: {
    message: string;
    code?: string;
    severity?: 'info' | 'warning' | 'error' | 'critical';
    timestamp?: string;
    context?: string;
    details?: Record<string, unknown>;
  };
  onDismiss?: () => void;
}

export function ErrorToast({ error, onDismiss }: ErrorToastProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'critical':
        return 'bg-red-200 text-red-900 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'info':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div
      className={`p-4 rounded-lg border shadow-lg max-w-sm ${getSeverityColor(error.severity || 'error')}`}
    >
      <div className="flex items-start space-x-3">
        {getSeverityIcon(error.severity || 'error')}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{error.message}</p>
          {error.context && (
            <p className="text-xs opacity-75 mt-1">{error.context}</p>
          )}
        </div>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        )}
      </div>
    </div>
  );
}

export default function ErrorDisplay({
  error,
  context,
  onRetry,
  onDismiss,
  showDetails = false,
  className,
}: ErrorDisplayProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const errorService = ErrorService.getInstance();

  const getErrorIcon = (error: Error) => {
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      return <WifiOff className="h-5 w-5" />;
    }
    if (
      error.message.includes('401') ||
      error.message.includes('unauthorized')
    ) {
      return <Lock className="h-5 w-5" />;
    }
    if (error.message.includes('403') || error.message.includes('forbidden')) {
      return <Shield className="h-5 w-5" />;
    }
    if (
      error.message.includes('validation') ||
      error.message.includes('invalid')
    ) {
      return <FileText className="h-5 w-5" />;
    }
    if (error.message.includes('timeout')) {
      return <Clock className="h-5 w-5" />;
    }
    return <AlertTriangle className="h-5 w-5" />;
  };

  const getErrorType = (error: Error): string => {
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      return 'Network Error';
    }
    if (
      error.message.includes('401') ||
      error.message.includes('unauthorized')
    ) {
      return 'Authentication Error';
    }
    if (error.message.includes('403') || error.message.includes('forbidden')) {
      return 'Authorization Error';
    }
    if (
      error.message.includes('validation') ||
      error.message.includes('invalid')
    ) {
      return 'Validation Error';
    }
    if (error.message.includes('timeout')) {
      return 'Timeout Error';
    }
    return 'System Error';
  };

  const getErrorSeverity = (
    error: Error
  ): 'low' | 'medium' | 'high' | 'critical' => {
    if (
      error.message.includes('401') ||
      error.message.includes('unauthorized')
    ) {
      return 'medium';
    }
    if (error.message.includes('403') || error.message.includes('forbidden')) {
      return 'medium';
    }
    if (
      error.message.includes('validation') ||
      error.message.includes('invalid')
    ) {
      return 'low';
    }
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      return 'high';
    }
    return 'high';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleRetry = async () => {
    if (onRetry) {
      setIsRetrying(true);
      try {
        await onRetry();
      } catch (retryError) {
        console.error('Retry failed:', retryError);
      } finally {
        setIsRetrying(false);
      }
    }
  };

  const handleReportBug = () => {
    errorService.submitUserFeedback({
      userId: 'anonymous', // Would get from auth context
      type: 'bug',
      title: `${getErrorType(error)} in ${context?.component || 'Unknown Component'}`,
      description: `Error: ${error.message}\n\nComponent: ${context?.component || 'Unknown'}\nAction: ${context?.action || 'Unknown'}\n\nStack: ${error.stack}`,
      priority: getErrorSeverity(error) === 'critical' ? 'urgent' : 'high',
      status: 'open',
      category: 'user-reported',
      tags: ['error', getErrorType(error).toLowerCase().replace(' ', '-')],
      attachments: [],
    });
  };

  const errorType = getErrorType(error);
  const errorSeverity = getErrorSeverity(error);
  const userMessage = errorService.getUserFriendlyMessage(error);
  const recoveryOptions = errorService.getErrorRecoveryOptions(error);

  return (
    <Card className={`border-red-200 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getErrorIcon(error)}
            <CardTitle className="text-lg">{errorType}</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getSeverityColor(errorSeverity)}>
              {errorSeverity.toUpperCase()}
            </Badge>
            {onDismiss && (
              <Button variant="ghost" size="sm" onClick={onDismiss}>
                ×
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{userMessage}</AlertDescription>
        </Alert>

        {recoveryOptions.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">What you can do:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {recoveryOptions.map((option, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full" />
                  <span>{option}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {onRetry && (
            <Button onClick={handleRetry} disabled={isRetrying} size="sm">
              {isRetrying ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {isRetrying ? 'Retrying...' : 'Try Again'}
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={handleReportBug}>
            <Bug className="h-4 w-4 mr-2" />
            Report Bug
          </Button>

          {showDetails && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            >
              {showTechnicalDetails ? (
                <ChevronUp className="h-4 w-4 mr-2" />
              ) : (
                <ChevronDown className="h-4 w-4 mr-2" />
              )}
              {showTechnicalDetails ? 'Hide' : 'Show'} Details
            </Button>
          )}
        </div>

        {showTechnicalDetails && (
          <div className="mt-4 space-y-2">
            <h4 className="font-semibold text-sm">Technical Details:</h4>
            <div className="text-xs bg-muted p-3 rounded space-y-1">
              <div>
                <strong>Error:</strong> {error.message}
              </div>
              <div>
                <strong>Type:</strong> {error.name}
              </div>
              {context?.component && (
                <div>
                  <strong>Component:</strong> {context.component}
                </div>
              )}
              {context?.action && (
                <div>
                  <strong>Action:</strong> {context.action}
                </div>
              )}
              {error.stack && (
                <div>
                  <strong>Stack:</strong>
                  <pre className="mt-1 text-xs overflow-auto">
                    {error.stack}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
