import { cn } from '@/lib/utils';
import AnimatedProgressBar from './AnimatedProgressBar';
import ConnectionStatus from './ConnectionStatus';

interface VoteCountDisplayProps {
  voteCounts: { option_a: number; option_b: number };
  optionLabels: { option_a: string; option_b: string };
  isConnected: boolean;
  lastUpdate: Date | null;
  error: string | null;
  className?: string;
}

export default function VoteCountDisplay({
  voteCounts,
  optionLabels,
  isConnected,
  lastUpdate,
  error,
  className,
}: VoteCountDisplayProps) {
  const totalVotes = voteCounts.option_a + voteCounts.option_b;
  const optionAPercentage =
    totalVotes > 0 ? Math.round((voteCounts.option_a / totalVotes) * 100) : 0;
  const optionBPercentage =
    totalVotes > 0 ? Math.round((voteCounts.option_b / totalVotes) * 100) : 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Connection Status */}
      <ConnectionStatus isConnected={isConnected} lastUpdate={lastUpdate} />

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Vote Counts */}
      <div className="text-center mb-4">
        <div className="text-2xl font-bold">{totalVotes}</div>
        <div className="text-sm text-muted-foreground">Total Votes</div>
      </div>

      {/* Option A Results */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">{optionLabels.option_a}</span>
          <span>
            {voteCounts.option_a} votes ({optionAPercentage}%)
          </span>
        </div>
        <AnimatedProgressBar
          value={voteCounts.option_a}
          max={totalVotes}
          color="bg-blue-500"
        />
      </div>

      {/* Option B Results */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">{optionLabels.option_b}</span>
          <span>
            {voteCounts.option_b} votes ({optionBPercentage}%)
          </span>
        </div>
        <AnimatedProgressBar
          value={voteCounts.option_b}
          max={totalVotes}
          color="bg-red-500"
        />
      </div>
    </div>
  );
}
