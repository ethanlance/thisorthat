'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertTriangle,
  RefreshCw,
  Home,
  Bug,
  Loader2,
} from 'lucide-react';
import { ErrorService } from '@/lib/error-handling/ErrorService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isRetrying: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  private errorService: ErrorService;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isRetrying: false,
    };
    this.errorService = ErrorService.getInstance();
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to service
    const errorId = this.errorService.logError({
      type: 'system',
      severity: 'high',
      message: error.message,
      userMessage: this.errorService.getUserFriendlyMessage(error),
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        component: this.constructor.name,
        action: 'component_error',
        metadata: {
          errorInfo,
          props: this.props,
        },
      },
      stack: error.stack,
    });

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    if (hasError && resetOnPropsChange) {
      if (resetKeys && prevProps.resetKeys) {
        const hasResetKeyChanged = resetKeys.some((key, index) => 
          key !== prevProps.resetKeys?.[index]
        );
        if (hasResetKeyChanged) {
          this.resetErrorBoundary();
        }
      }
    }
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isRetrying: false,
    });
  };

  handleRetry = async () => {
    this.setState({ isRetrying: true });

    try {
      // Wait a moment before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.resetErrorBoundary();
    } catch (error) {
      console.error('Error during retry:', error);
    } finally {
      this.setState({ isRetrying: false });
    }
  };

  handleReportBug = () => {
    if (this.state.error) {
      this.errorService.submitUserFeedback({
        userId: 'anonymous', // Would get from auth context
        type: 'bug',
        title: 'Application Error',
        description: `Error: ${this.state.error.message}\n\nStack: ${this.state.error.stack}`,
        priority: 'high',
        status: 'open',
        category: 'error-boundary',
        tags: ['error', 'crash'],
        attachments: [],
      });
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {this.errorService.getUserFriendlyMessage(this.state.error!)}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">What you can do:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {this.errorService.getErrorRecoveryOptions(this.state.error!).map((option, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full" />
                      <span>{option}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col space-y-2">
                <Button
                  onClick={this.handleRetry}
                  disabled={this.state.isRetrying}
                  className="w-full"
                >
                  {this.state.isRetrying ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  {this.state.isRetrying ? 'Retrying...' : 'Try Again'}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                  className="w-full"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>

                <Button
                  variant="outline"
                  onClick={this.handleReportBug}
                  className="w-full"
                >
                  <Bug className="h-4 w-4 mr-2" />
                  Report Bug
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium">
                    Technical Details
                  </summary>
                  <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}