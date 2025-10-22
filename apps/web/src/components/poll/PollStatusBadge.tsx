'use client';

import { Badge } from '@/components/ui/badge';
import { PollStatus } from '@/lib/services/expiration';
import { cn } from '@/lib/utils';

interface PollStatusBadgeProps {
  status: PollStatus;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  active: {
    label: 'Active',
    variant: 'default' as const,
    className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
  },
  closed: {
    label: 'Closed',
    variant: 'secondary' as const,
    className: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
  },
  deleted: {
    label: 'Deleted',
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
  }
};

const sizeConfig = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-2.5 py-1.5',
  lg: 'text-base px-3 py-2'
};

export default function PollStatusBadge({ 
  status, 
  className, 
  size = 'md' 
}: PollStatusBadgeProps) {
  const config = statusConfig[status];
  const sizeClasses = sizeConfig[size];
  
  return (
    <Badge
      variant={config.variant}
      className={cn(
        'font-medium border',
        config.className,
        sizeClasses,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
