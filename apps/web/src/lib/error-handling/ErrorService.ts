export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  timestamp?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

export interface ErrorReport {
  id: string;
  type:
    | 'network'
    | 'validation'
    | 'system'
    | 'authentication'
    | 'authorization'
    | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  userMessage: string;
  context: ErrorContext;
  stack?: string;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserFeedback {
  id: string;
  userId: string;
  type: 'bug' | 'feature' | 'improvement' | 'general';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'duplicate';
  category: string;
  tags: string[];
  attachments: string[];
  votes: number;
  createdAt: string;
  updatedAt: string;
}

export class ErrorService {
  private static instance: ErrorService;
  private errorReports: ErrorReport[] = [];
  private userFeedback: UserFeedback[] = [];

  private constructor() {
    this.initializeErrorHandling();
  }

  public static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService();
    }
    return ErrorService.instance;
  }

  private initializeErrorHandling() {
    // Only initialize on client side
    if (typeof window === 'undefined') return;

    // Global error handlers
    window.addEventListener('error', this.handleGlobalError.bind(this));
    window.addEventListener(
      'unhandledrejection',
      this.handleUnhandledRejection.bind(this)
    );
  }

  private handleGlobalError(event: ErrorEvent) {
    this.logError({
      type: 'system',
      severity: 'high',
      message: event.message,
      userMessage: 'Something went wrong. Please try again.',
      context: {
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        component: 'global',
        action: 'unhandled_error',
      },
      stack: event.error?.stack,
    });
  }

  private handleUnhandledRejection(event: PromiseRejectionEvent) {
    this.logError({
      type: 'system',
      severity: 'high',
      message: event.reason?.message || 'Unhandled promise rejection',
      userMessage: 'Something went wrong. Please try again.',
      context: {
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        component: 'global',
        action: 'unhandled_rejection',
      },
      stack: event.reason?.stack,
    });
  }

  public logError(
    errorData: Omit<ErrorReport, 'id' | 'resolved' | 'createdAt' | 'updatedAt'>
  ): string {
    const errorReport: ErrorReport = {
      id: this.generateId(),
      ...errorData,
      resolved: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.errorReports.push(errorReport);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorReport);
    }

    // Send to external monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(errorReport);
    }

    return errorReport.id;
  }

  public getUserFriendlyMessage(error: Error): string {
    // Network errors
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }

    // Authentication errors
    if (
      error.message.includes('401') ||
      error.message.includes('unauthorized')
    ) {
      return 'Your session has expired. Please log in again.';
    }

    // Authorization errors
    if (error.message.includes('403') || error.message.includes('forbidden')) {
      return "You don't have permission to perform this action.";
    }

    // Validation errors
    if (
      error.message.includes('validation') ||
      error.message.includes('invalid')
    ) {
      return 'Please check your input and try again.';
    }

    // File upload errors
    if (error.message.includes('file') || error.message.includes('upload')) {
      return 'There was a problem uploading your file. Please try again with a different file.';
    }

    // Rate limiting
    if (error.message.includes('429') || error.message.includes('rate limit')) {
      return "You're making requests too quickly. Please wait a moment and try again.";
    }

    // Server errors
    if (error.message.includes('500') || error.message.includes('server')) {
      return 'Our servers are experiencing issues. Please try again in a few minutes.';
    }

    // Default message
    return 'Something went wrong. Please try again.';
  }

  public getErrorRecoveryOptions(error: Error): string[] {
    const options: string[] = [];

    // Network errors
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      options.push('Check your internet connection');
      options.push('Try again in a few moments');
      options.push('Refresh the page');
    }

    // Authentication errors
    if (
      error.message.includes('401') ||
      error.message.includes('unauthorized')
    ) {
      options.push('Log in again');
      options.push('Clear your browser cache');
    }

    // Validation errors
    if (
      error.message.includes('validation') ||
      error.message.includes('invalid')
    ) {
      options.push('Check your input');
      options.push('Try with different values');
    }

    // File upload errors
    if (error.message.includes('file') || error.message.includes('upload')) {
      options.push('Try a different file');
      options.push('Check file size and format');
    }

    // Default options
    if (options.length === 0) {
      options.push('Try again');
      options.push('Refresh the page');
      options.push('Contact support if the problem persists');
    }

    return options;
  }

  public async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxRetries) {
          break;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }

    throw lastError!;
  }

  public async submitUserFeedback(
    feedback: Omit<UserFeedback, 'id' | 'votes' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const userFeedback: UserFeedback = {
      id: this.generateId(),
      ...feedback,
      votes: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.userFeedback.push(userFeedback);

    // Send to backend
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userFeedback),
      });
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }

    return userFeedback.id;
  }

  public getUserFeedback(userId: string): UserFeedback[] {
    return this.userFeedback.filter(feedback => feedback.userId === userId);
  }

  public getErrorReports(): ErrorReport[] {
    return this.errorReports;
  }

  public getErrorReport(id: string): ErrorReport | undefined {
    return this.errorReports.find(report => report.id === id);
  }

  public markErrorAsResolved(id: string): boolean {
    const report = this.errorReports.find(r => r.id === id);
    if (report) {
      report.resolved = true;
      report.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  public getErrorStats(): {
    total: number;
    resolved: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  } {
    const total = this.errorReports.length;
    const resolved = this.errorReports.filter(r => r.resolved).length;

    const byType = this.errorReports.reduce(
      (acc, report) => {
        acc[report.type] = (acc[report.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const bySeverity = this.errorReports.reduce(
      (acc, report) => {
        acc[report.severity] = (acc[report.severity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return { total, resolved, byType, bySeverity };
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private async sendToMonitoringService(
    errorReport: ErrorReport
  ): Promise<void> {
    // In a real implementation, this would send to services like Sentry, LogRocket, etc.
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport),
      });
    } catch (error) {
      console.error('Failed to send error to monitoring service:', error);
    }
  }
}
