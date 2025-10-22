import { cn } from '@/lib/utils';
import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  lastUpdate: Date | null;
  className?: string;
}

export default function ConnectionStatus({ 
  isConnected, 
  lastUpdate,
  className 
}: ConnectionStatusProps) {
  if (isConnected) return null;

  return (
    <div className={cn('bg-yellow-50 border border-yellow-200 rounded-lg p-3', className)}>
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 text-yellow-600" />
        <span className="text-sm text-yellow-800">
          Connection lost. Attempting to reconnect...
        </span>
      </div>
      {lastUpdate && (
        <div className="text-xs text-yellow-600 mt-1">
          Last update: {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
