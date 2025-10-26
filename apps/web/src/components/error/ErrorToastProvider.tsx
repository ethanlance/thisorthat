'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { ErrorToast } from './ErrorDisplay';
import { ErrorHandlingService } from '@/lib/services/error-handling';

interface ErrorToastContextType {
  showError: (error: {
    message: string;
    code?: string;
    severity?: 'info' | 'warning' | 'error' | 'critical';
    timestamp?: string;
    context?: string;
    details?: Record<string, unknown>;
  }) => void;
  showNetworkError: () => void;
  showServerError: () => void;
  showValidationError: (errors: string[]) => void;
}

const ErrorToastContext = createContext<ErrorToastContextType | undefined>(
  undefined
);

interface ErrorToast {
  id: string;
  error: {
    message: string;
    code?: string;
    severity?: 'info' | 'warning' | 'error' | 'critical';
    timestamp?: string;
    context?: string;
    details?: Record<string, unknown>;
  };
}

export function ErrorToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<ErrorToast[]>([]);

  const showError = useCallback((error: ErrorToast['error']) => {
    const id = Math.random().toString(36).substr(2, 9);
    const toast: ErrorToast = {
      id,
      error: {
        ...error,
        timestamp: error.timestamp || new Date().toISOString(),
      },
    };

    setToasts(prev => [...prev, toast]);

    // Auto-dismiss after 5 seconds for non-critical errors
    if (error.severity !== 'critical') {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 5000);
    }
  }, []);

  const showNetworkError = useCallback(() => {
    showError({
      message:
        "You're offline or have a poor connection. Please check your internet and try again.",
      code: 'NETWORK_ERROR',
      severity: 'warning',
    });
  }, [showError]);

  const showServerError = useCallback(() => {
    showError({
      message:
        'Our servers are experiencing issues. Please try again in a few moments.',
      code: 'SERVER_ERROR',
      severity: 'error',
    });
  }, [showError]);

  const showValidationError = useCallback(
    (errors: string[]) => {
      errors.forEach(error => {
        showError({
          message: error,
          code: 'VALIDATION_ERROR',
          severity: 'warning',
        });
      });
    },
    [showError]
  );

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      showError({
        message: "You're back online!",
        code: 'NETWORK_RECOVERED',
        severity: 'info',
      });
    };

    const handleOffline = () => {
      showNetworkError();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showError, showNetworkError]);

  const contextValue: ErrorToastContextType = {
    showError,
    showNetworkError,
    showServerError,
    showValidationError,
  };

  return (
    <ErrorToastContext.Provider value={contextValue}>
      {children}

      {/* Render toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <ErrorToast
            key={toast.id}
            error={toast.error}
            onDismiss={() => dismissToast(toast.id)}
          />
        ))}
      </div>
    </ErrorToastContext.Provider>
  );
}

export function useErrorToast() {
  const context = useContext(ErrorToastContext);
  if (context === undefined) {
    throw new Error('useErrorToast must be used within an ErrorToastProvider');
  }
  return context;
}

// Hook for handling API errors
export function useApiErrorHandler() {
  const { showError, showNetworkError, showServerError } = useErrorToast();

  const handleApiError = useCallback(
    (error: unknown, context?: string) => {
      // Convert unknown error to Error object
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      const formattedError =
        ErrorHandlingService.createUserFriendlyMessage(errorObj);

      // Log the error
      ErrorHandlingService.logError(
        new Error(formattedError),
        {
          userId: undefined, // Will be set by the service if user is authenticated
          action: 'api_error',
          component: context || 'Unknown',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          additionalData: {
            errorMessage: formattedError,
            originalError: errorObj.message,
          },
        },
        'medium'
      );

      // Show appropriate toast based on error type
      if (
        formattedError.includes('network') ||
        formattedError.includes('connection')
      ) {
        showNetworkError();
      } else if (
        formattedError.includes('server') ||
        formattedError.includes('technical')
      ) {
        showServerError();
      } else {
        showError({
          message: formattedError,
          code:
            formattedError.includes('authorized') ||
            formattedError.includes('permission')
              ? 'AUTH_ERROR'
              : 'GENERIC_ERROR',
          severity:
            formattedError.includes('authorized') ||
            formattedError.includes('permission')
              ? 'warning'
              : 'error',
        });
      }
    },
    [showError, showNetworkError, showServerError]
  );

  return { handleApiError };
}
