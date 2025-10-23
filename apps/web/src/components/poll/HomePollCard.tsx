'use client';

import { useState, useEffect } from 'react';
import { PollWithResults } from '@/lib/services/polls';
import { useAnonymousVoting } from '@/lib/hooks/useAnonymousVoting';
import { useRealtimeVotes } from '@/lib/hooks/useRealtimeVotes';
import PollView from './PollView';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface HomePollCardProps {
  initialPoll: PollWithResults;
}

export default function HomePollCard({ initialPoll }: HomePollCardProps) {
  const [poll, setPoll] = useState<PollWithResults>(initialPoll);
  const { vote, isVoting, hasVoted, userVote, error } = useAnonymousVoting(
    poll.id
  );

  // Subscribe to real-time vote updates
  const { voteCounts, isConnected, lastUpdate, error: realtimeError } = useRealtimeVotes(poll.id);

  // Update vote counts when real-time data changes
  useEffect(() => {
    if (voteCounts) {
      setPoll(prev => ({
        ...prev,
        vote_counts: voteCounts,
      }));
    }
  }, [voteCounts]);

  const handleVote = async (choice: 'option_a' | 'option_b') => {
    const success = await vote(choice);
    return success;
  };

  const handleRefetch = () => {
    // Refetch would typically reload the page or re-fetch data
    window.location.reload();
  };

  // Show error if no poll available
  if (!poll) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-4 text-center">
          <Alert>
            <AlertDescription>
              No polls available at the moment. Create one to get started!
            </AlertDescription>
          </Alert>
          <Button asChild size="lg" className="w-full">
            <Link href="/poll/create">Create Your First Poll</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full">
      <PollView
        poll={poll}
        onVote={handleVote}
        isVoting={isVoting}
        hasVoted={hasVoted}
        userVote={userVote}
        onRefetch={handleRefetch}
        className="bg-background"
      />
      
      {error && (
        <div className="fixed bottom-4 right-4 max-w-sm">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}

