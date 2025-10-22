import { cn } from '@/lib/utils';
import AnimatedProgressBar from './AnimatedProgressBar';

interface ResultsChartProps {
  voteCounts: { option_a: number; option_b: number };
  optionLabels: { option_a: string; option_b: string };
  pollStatus: 'active' | 'closed';
  className?: string;
}

export default function ResultsChart({
  voteCounts,
  optionLabels,
  pollStatus,
  className,
}: ResultsChartProps) {
  const totalVotes = voteCounts.option_a + voteCounts.option_b;
  const optionAPercentage =
    totalVotes > 0 ? Math.round((voteCounts.option_a / totalVotes) * 100) : 0;
  const optionBPercentage =
    totalVotes > 0 ? Math.round((voteCounts.option_b / totalVotes) * 100) : 0;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Results Header */}
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">
          {pollStatus === 'active' ? 'Current Results' : 'Final Results'}
        </h2>
        <div className="text-3xl font-bold text-primary">{totalVotes}</div>
        <div className="text-sm text-muted-foreground">Total Votes</div>
      </div>

      {/* Results Chart */}
      <div className="space-y-4">
        {/* Option A */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium">{optionLabels.option_a}</span>
            <div className="text-right">
              <div className="text-lg font-bold">{voteCounts.option_a}</div>
              <div className="text-sm text-muted-foreground">
                {optionAPercentage}%
              </div>
            </div>
          </div>
          <AnimatedProgressBar
            value={voteCounts.option_a}
            max={totalVotes}
            color="bg-blue-500"
          />
        </div>

        {/* Option B */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium">{optionLabels.option_b}</span>
            <div className="text-right">
              <div className="text-lg font-bold">{voteCounts.option_b}</div>
              <div className="text-sm text-muted-foreground">
                {optionBPercentage}%
              </div>
            </div>
          </div>
          <AnimatedProgressBar
            value={voteCounts.option_b}
            max={totalVotes}
            color="bg-red-500"
          />
        </div>
      </div>

      {/* Results Summary */}
      <div className="bg-muted rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {voteCounts.option_a}
            </div>
            <div className="text-sm text-muted-foreground">
              {optionLabels.option_a}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {voteCounts.option_b}
            </div>
            <div className="text-sm text-muted-foreground">
              {optionLabels.option_b}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
