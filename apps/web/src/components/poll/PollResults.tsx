'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Share2, Users, TrendingUp } from 'lucide-react';
import { PollWithResults } from '@/lib/services/polls';
import { cn } from '@/lib/utils';
import { useRealtimeVotes } from '@/lib/hooks/useRealtimeVotes';
import VoteCountDisplay from './VoteCountDisplay';
import ResultsChart from './ResultsChart';
import ResultsShare from './ResultsShare';

interface PollResultsProps {
  poll: PollWithResults;
  userVote?: 'option_a' | 'option_b' | null;
  onShare?: () => void;
  className?: string;
}

export default function PollResults({
  poll,
  userVote,
  onShare,
  className,
}: PollResultsProps) {
  // Use real-time vote counts
  const { voteCounts, isConnected, lastUpdate, error } = useRealtimeVotes(
    poll.id
  );

  const totalVotes = voteCounts.option_a + voteCounts.option_b;
  const optionAPercentage =
    totalVotes > 0 ? Math.round((voteCounts.option_a / totalVotes) * 100) : 0;
  const optionBPercentage =
    totalVotes > 0 ? Math.round((voteCounts.option_b / totalVotes) * 100) : 0;

  const handleShare = async () => {
    if (onShare) {
      onShare();
      return;
    }

    try {
      const shareUrl = `${window.location.origin}/poll/${poll.id}`;
      await navigator.clipboard.writeText(shareUrl);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

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
    </div>
  );
}
