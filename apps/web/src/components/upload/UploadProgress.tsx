'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';

interface UploadProgressProps {
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
  onRetry?: () => void;
  className?: string;
}

export default function UploadProgress({
  progress,
  status,
  error,
  onRetry,
  className = '',
}: UploadProgressProps) {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    if (status === 'uploading') {
      const timer = setTimeout(() => {
        setDisplayProgress(progress);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setDisplayProgress(progress);
    }
  }, [progress, status]);

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'uploading':
      default:
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'success':
        return 'Upload complete';
      case 'error':
        return 'Upload failed';
      case 'uploading':
      default:
        return 'Uploading...';
    }
  };

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center space-x-3">
        {getStatusIcon()}
        <div className="flex-1">
          <p className="text-sm font-medium">{getStatusText()}</p>
          {status === 'uploading' && (
            <div className="mt-2">
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${displayProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {displayProgress}%
              </p>
            </div>
          )}
        </div>
      </div>

      {status === 'error' && error && (
        <Alert variant="destructive" className="mt-3">
          <p className="text-sm">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Try again
            </button>
          )}
        </Alert>
      )}
    </Card>
  );
}
