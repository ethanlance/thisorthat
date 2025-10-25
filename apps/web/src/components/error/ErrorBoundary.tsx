'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorHandlingService } from '@/lib/services/error-handling';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to service
    this.logError(error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private async logError(error: Error, errorInfo: ErrorInfo) {
    try {
      const context = {
        userId: undefined, // Will be set by the service if user is authenticated
        action: 'component_render',
        component: errorInfo.componentStack?.split('\n')[0] || 'Unknown',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        additionalData: {
          componentStack: errorInfo.componentStack,
          errorBoundary: true,
        },
      };

      const errorId = await ErrorHandlingService.logError(
        error,
        context,
        'high'
      );
      this.setState({ errorId });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportBug = () => {
    // Open bug report modal or redirect to feedback page
    window.location.href = '/feedback?type=bug_report';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          errorId={this.state.errorId}
          showDetails={this.props.showDetails}
          onRetry={this.handleRetry}
          onGoHome={this.handleGoHome}
          onReportBug={this.handleReportBug}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  errorId: string | null;
  showDetails?: boolean;
  onRetry: () => void;
  onGoHome: () => void;
  onReportBug: () => void;
}

function ErrorFallback({
  error,
  errorId,
  showDetails = false,
  onRetry,
  onGoHome,
  onReportBug,
}: ErrorFallbackProps) {
  const { user } = useAuth();
  const [showFullDetails, setShowFullDetails] = React.useState(false);

  const userFriendlyMessage = error
    ? ErrorHandlingService.createUserFriendlyMessage(error)
    : 'Something went wrong. Please try again.';

  const recoveryActions = error
    ? ErrorHandlingService.getRecoveryActions(error)
    : ['Try refreshing the page', 'Check your internet connection'];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-semibold">
            Oops! Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">{userFriendlyMessage}</p>

            {errorId && (
              <p className="text-sm text-muted-foreground mb-4">
                Error ID: {errorId}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">What you can try:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {recoveryActions.map((action, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={onRetry} className="flex-1">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button variant="outline" onClick={onGoHome} className="flex-1">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
            <Button variant="outline" onClick={onReportBug} className="flex-1">
              <Bug className="mr-2 h-4 w-4" />
              Report Bug
            </Button>
          </div>

          {showDetails && error && (
            <div className="border-t pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFullDetails(!showFullDetails)}
                className="w-full"
              >
                {showFullDetails ? 'Hide' : 'Show'} Technical Details
              </Button>

              {showFullDetails && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h5 className="font-medium mb-2">Error Details:</h5>
                  <pre className="text-xs text-muted-foreground overflow-auto">
                    {error.message}
                    {error.stack && `\n\nStack Trace:\n${error.stack}`}
                  </pre>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Hook for functional components to trigger error boundary
export function useErrorHandler() {
  return (error: Error, errorInfo?: { componentStack?: string }) => {
    const context = {
      userId: undefined,
      action: 'functional_component_error',
      component: errorInfo?.componentStack?.split('\n')[0] || 'Unknown',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      additionalData: {
        componentStack: errorInfo?.componentStack,
        functionalComponent: true,
      },
    };

    ErrorHandlingService.logError(error, context, 'medium');
  };
}
