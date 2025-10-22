import { Skeleton } from './skeleton';
import LoadingSpinner from '../layout/LoadingSpinner';

interface LoadingStateProps {
  type?: 'spinner' | 'skeleton';
  text?: string;
  className?: string;
  children?: React.ReactNode;
}

export default function LoadingState({
  type = 'spinner',
  text,
  className = '',
  children,
}: LoadingStateProps) {
  if (type === 'skeleton') {
    return (
      <div className={`space-y-4 ${className}`}>
        {children || (
          <>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-5/6" />
          </>
        )}
      </div>
    );
  }

  return <LoadingSpinner text={text} className={className} />;
}
