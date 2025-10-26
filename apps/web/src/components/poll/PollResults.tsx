'use client';

import { Users } from 'lucide-react';
import { PollWithResults } from '@/lib/services/polls';
import { cn } from '@/lib/utils';
import { useRealtimeVotes } from '@/lib/hooks/useRealtimeVotes';
import ResultsChart from './ResultsChart';
import ResultsShare from './ResultsShare';
import { ConversionCTA } from './ConversionCTA';

interface PollResultsProps {
  poll: PollWithResults;
  userVote?: 'option_a' | 'option_b' | null;
  onShare?: () => void;
  showConversionCTA?: boolean; // Show CTA on homepage demo poll
  className?: string;
}

export default function PollResults({
  poll,
  userVote,
  onShare,
  showConversionCTA = false,
  className,
}: PollResultsProps) {
  // onShare is available but not used in this component
  void onShare;
  // Use real-time vote counts
  const { voteCounts } = useRealtimeVotes(poll.id);

  const totalVotes = voteCounts.option_a + voteCounts.option_b;

  if (totalVotes === 0) {
    return (
      <div className={cn('text-center space-y-4', className)}>
        <div className="bg-muted rounded-lg p-6">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No votes yet</h3>
          <p className="text-muted-foreground">
            Be the first to vote on this poll!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Enhanced Results Chart */}
      <ResultsChart
        voteCounts={voteCounts}
        optionLabels={{
          option_a: poll.option_a_label || 'Option A',
          option_b: poll.option_b_label || 'Option B',
        }}
        pollStatus={poll.status === 'deleted' ? 'closed' : poll.status}
      />

      {/* User Vote Indicator */}
      {userVote && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
            <span>You voted for</span>
            <span className="font-semibold">
              {userVote === 'option_a'
                ? poll.option_a_label || 'Option A'
                : poll.option_b_label || 'Option B'}
            </span>
          </div>
        </div>
      )}

      {/* Enhanced Share Component */}
      <ResultsShare
        pollId={poll.id}
        pollTitle={poll.description || 'Poll Results'}
        voteCounts={voteCounts}
        optionLabels={{
          option_a: poll.option_a_label || 'Option A',
          option_b: poll.option_b_label || 'Option B',
        }}
      />

      {/* Additional Stats */}
      {totalVotes > 0 && (
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-muted rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-600">
              {voteCounts.option_a}
            </div>
            <div className="text-sm text-muted-foreground">
              {poll.option_a_label || 'Option A'}
            </div>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <div className="text-2xl font-bold text-red-600">
              {voteCounts.option_b}
            </div>
            <div className="text-sm text-muted-foreground">
              {poll.option_b_label || 'Option B'}
            </div>
          </div>
        </div>
      )}

      {/* Conversion CTA for homepage demo poll */}
      {showConversionCTA && <ConversionCTA />}
    </div>
  );
}
