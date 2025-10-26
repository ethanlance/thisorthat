import { createClient } from '@/lib/supabase/client';

export interface ErrorContext {
  userId?: string;
  action?: string;
  component?: string;
  timestamp: string;
  userAgent?: string;
  url?: string;
  additionalData?: Record<string, unknown>;
}

export interface ErrorReport {
  id?: string;
  error_type:
    | 'network'
    | 'validation'
    | 'authentication'
    | 'authorization'
    | 'system'
    | 'unknown';
  error_message: string;
  error_stack?: string;
  error_code?: string;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  created_at?: string;
  updated_at?: string;
}

export interface UserFeedback {
  id?: string;
  user_id?: string;
  feedback_type:
    | 'bug_report'
    | 'feature_request'
    | 'general_feedback'
    | 'error_report';
  title: string;
  description: string;
  category?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'under_review' | 'in_progress' | 'resolved' | 'closed';
  attachments?: string[];
  additional_data?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export class ErrorHandlingService {
  /**
   * Log an error with context
   */
  static async logError(
    error: Error,
    context: ErrorContext,
    severity: ErrorReport['severity'] = 'medium'
  ): Promise<string | null> {
    try {
      const supabase = createClient();

      const errorReport: Omit<ErrorReport, 'id' | 'created_at' | 'updated_at'> =
        {
          error_type: this.categorizeError(error),
          error_message: error.message,
          error_stack: error.stack,
          error_code: this.extractErrorCode(error),
          context,
          severity,
          status: 'open',
        };

      const { data, error: insertError } = await supabase
        .from('error_reports')
        .insert(errorReport)
        .select('id')
        .single();

      if (insertError) {
        console.error('Failed to log error:', insertError);
        return null;
      }

      // Also log to console for development
      console.error('Error logged:', {
        id: data.id,
        error: error.message,
        context,
        severity,
      });

      return data.id;
    } catch (logError) {
      console.error('Failed to log error:', logError);
      return null;
    }
  }

  /**
   * Submit user feedback
   */
  static async submitFeedback(
    feedback: Omit<UserFeedback, 'id' | 'created_at' | 'updated_at'>
  ): Promise<string | null> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('user_feedback')
        .insert(feedback)
        .select('id')
        .single();

      if (error) {
        console.error('Failed to submit feedback:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      return null;
    }
  }

  /**
   * Get user's feedback history
   */
  static async getUserFeedback(userId: string): Promise<UserFeedback[]> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('user_feedback')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch user feedback:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch user feedback:', error);
      return [];
    }
  }

  /**
   * Get error statistics for monitoring
   */
  static async getErrorStats(
    timeframe: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<{
    total_errors: number;
    errors_by_type: Record<string, number>;
    errors_by_severity: Record<string, number>;
    recent_errors: ErrorReport[];
  }> {
    try {
      const supabase = createClient();

      const timeFilter = this.getTimeFilter(timeframe);

      const { data: errors, error } = await supabase
        .from('error_reports')
        .select('*')
        .gte('created_at', timeFilter)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Failed to fetch error stats:', error);
        return {
          total_errors: 0,
          errors_by_type: {},
          errors_by_severity: {},
          recent_errors: [],
        };
      }

      const total_errors = errors?.length || 0;
      const errors_by_type: Record<string, number> = {};
      const errors_by_severity: Record<string, number> = {};

      errors?.forEach(error => {
        errors_by_type[error.error_type] =
          (errors_by_type[error.error_type] || 0) + 1;
        errors_by_severity[error.severity] =
          (errors_by_severity[error.severity] || 0) + 1;
      });

      return {
        total_errors,
        errors_by_type,
        errors_by_severity,
        recent_errors: errors || [],
      };
    } catch (error) {
      console.error('Failed to fetch error stats:', error);
      return {
        total_errors: 0,
        errors_by_type: {},
        errors_by_severity: {},
        recent_errors: [],
      };
    }
  }

  /**
   * Categorize error type based on error message and context
   */
  private static categorizeError(error: Error): ErrorReport['error_type'] {
    const message = error.message.toLowerCase();

    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('connection')
    ) {
      return 'network';
    }
    if (
      message.includes('validation') ||
      message.includes('invalid') ||
      message.includes('required')
    ) {
      return 'validation';
    }
    if (
      message.includes('auth') ||
      message.includes('login') ||
      message.includes('unauthorized')
    ) {
      return 'authentication';
    }
    if (
      message.includes('forbidden') ||
      message.includes('permission') ||
      message.includes('access')
    ) {
      return 'authorization';
    }
    if (
      message.includes('server') ||
      message.includes('internal') ||
      message.includes('database')
    ) {
      return 'system';
    }

    return 'unknown';
  }

  /**
   * Extract error code from error message or stack
   */
  private static extractErrorCode(error: Error): string | undefined {
    // Look for common error code patterns
    const codeMatch = error.message.match(/(?:error|code)[\s:]*(\d+)/i);
    if (codeMatch) {
      return codeMatch[1];
    }

    // Look for HTTP status codes
    const statusMatch = error.message.match(/(\d{3})/);
    if (statusMatch) {
      return statusMatch[1];
    }

    return undefined;
  }

  /**
   * Get time filter for error stats
   */
  private static getTimeFilter(timeframe: string): string {
    const now = new Date();
    const filters = {
      hour: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
      day: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    return filters[timeframe as keyof typeof filters] || filters.day;
  }

  /**
   * Create user-friendly error message
   */
  static createUserFriendlyMessage(error: Error): string {
    const errorType = this.categorizeError(error);

    const messages = {
      network:
        "We're having trouble connecting to our servers. Please check your internet connection and try again.",
      validation:
        "There's an issue with the information you provided. Please review your input and try again.",
      authentication:
        'You need to sign in to access this feature. Please log in and try again.',
      authorization:
        "You don't have permission to perform this action. Please contact support if you believe this is an error.",
      system:
        "We're experiencing technical difficulties. Our team has been notified and is working to fix this.",
      unknown:
        'Something went wrong. Please try again, and if the problem persists, contact support.',
    };

    return messages[errorType];
  }

  /**
   * Get suggested actions for error recovery
   */
  static getRecoveryActions(error: Error): string[] {
    const errorType = this.categorizeError(error);

    const actions = {
      network: [
        'Check your internet connection',
        'Try refreshing the page',
        'Wait a moment and try again',
      ],
      validation: [
        'Review the highlighted fields',
        'Check that all required information is provided',
        'Ensure file formats are correct',
      ],
      authentication: [
        'Sign in to your account',
        'Check your login credentials',
        'Try resetting your password',
      ],
      authorization: [
        'Contact support for access',
        "Check if you're using the correct account",
        'Wait for permissions to be granted',
      ],
      system: [
        'Try again in a few minutes',
        'Refresh the page',
        'Contact support if the problem persists',
      ],
      unknown: [
        'Try refreshing the page',
        'Check your internet connection',
        'Contact support if the problem continues',
      ],
    };

    return actions[errorType];
  }
}
