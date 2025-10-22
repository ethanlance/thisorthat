'use client';

import { useEffect } from 'react';
import { PollWithResults } from '@/lib/services/polls';
import { usePoll } from '@/lib/hooks/usePoll';
import { AnalyticsService } from '@/lib/services/analytics';
import PollView from '@/components/poll/PollView';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import ErrorDisplay from '@/components/ui/error-display';

interface PollViewClientProps {
  poll: PollWithResults;
}

export default function PollViewClient({ poll: initialPoll }: PollViewClientProps) {
  const { 
    poll, 
    loading, 
    error, 
    hasVoted, 
    userVote, 
    isVoting, 
    vote, 
    refetch 
  } = usePoll(initialPoll.id);

  // Track poll access on component mount
  useEffect(() => {
    const trackAccess = async () => {
      try {
        await AnalyticsService.trackPollAccess(initialPoll.id);
      } catch (error) {
        console.warn('Failed to track poll access:', error);
      }
    };

    trackAccess();
  }, [initialPoll.id]);

  // Use the real-time poll data if available, otherwise fall back to initial data
  const currentPoll = poll || initialPoll;

  if (loading && !poll) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !poll) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <ErrorDisplay error={error} />
      </div>
    );
  }

  return (
    <PollView
      poll={currentPoll}
      onVote={vote}
      isVoting={isVoting}
      hasVoted={hasVoted}
      userVote={userVote}
      onRefetch={refetch}
    />
  );
}
