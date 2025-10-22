import { cn } from '@/lib/utils';

interface AnimatedProgressBarProps {
  value: number;
  max: number;
  color: string;
  className?: string;
  showPercentage?: boolean;
}

export default function AnimatedProgressBar({ 
  value, 
  max, 
  color, 
  className,
  showPercentage = false
}: AnimatedProgressBarProps) {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  
  return (
    <div 
      className={cn('w-full bg-muted rounded-full h-3 overflow-hidden relative', className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={`Progress: ${Math.round(percentage)}%`}
    >
      <div
        className={cn('h-full transition-all duration-500 ease-out', color)}
        style={{ width: `${percentage}%` }}
      />
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-foreground">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
}
