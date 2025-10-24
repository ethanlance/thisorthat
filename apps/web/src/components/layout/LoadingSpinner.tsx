import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  text?: string;
  className?: string;
}

export default function LoadingSpinner({
  text,
  className = '',
}: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        {text && <p className="text-muted-foreground">{text}</p>}
      </div>
    </div>
  );
}
