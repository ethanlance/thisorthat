import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './button';
import { Alert, AlertDescription, AlertTitle } from './alert';

interface ErrorDisplayProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
  showDetails?: boolean;
  error?: Error;
  className?: string;
}

export default function ErrorDisplay({
  title = "Something went wrong",
  message = "We encountered an unexpected error. Please try again.",
  onRetry,
  onGoHome,
  showDetails = false,
  error,
  className = ""
}: ErrorDisplayProps) {
  return (
    <div className={`flex flex-col items-center justify-center min-h-[400px] p-8 text-center ${className}`}>
      <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
      
      <Alert className="max-w-md mb-6">
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>

      <div className="flex flex-col sm:flex-row gap-3">
        {onRetry && (
          <Button onClick={onRetry} variant="default">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
        
        {onGoHome && (
          <Button onClick={onGoHome} variant="outline">
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        )}
      </div>

      {showDetails && error && process.env.NODE_ENV === 'development' && (
        <details className="mt-6 p-4 bg-muted rounded-md text-left max-w-2xl">
          <summary className="cursor-pointer font-medium">
            Error Details (Development)
          </summary>
          <pre className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap">
            {error.stack}
          </pre>
        </details>
      )}
    </div>
  );
}
