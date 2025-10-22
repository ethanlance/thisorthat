'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PollWithResults } from '@/lib/services/polls';
import { cn } from '@/lib/utils';

interface PollVotingProps {
  poll: PollWithResults;
  onVote: (choice: 'option_a' | 'option_b') => Promise<boolean>;
  isVoting: boolean;
  hasVoted: boolean;
  userVote: 'option_a' | 'option_b' | null;
  className?: string;
}

export default function PollVoting({ 
  poll, 
  onVote, 
  isVoting, 
  hasVoted,
  userVote,
  className 
}: PollVotingProps) {
  const [voteError, setVoteError] = useState<string | null>(null);

  const handleVote = async (choice: 'option_a' | 'option_b') => {
    if (hasVoted || isVoting) return;
    
    setVoteError(null);
    const success = await onVote(choice);
    
    if (!success) {
      setVoteError('Failed to submit vote. Please try again.');
    }
  };

  if (hasVoted) {
    return (
      <div className={cn('text-center space-y-4', className)}>
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-400 mb-2">
            Vote Submitted!
          </h3>
          <p className="text-green-700 dark:text-green-300">
            You voted for <strong>{userVote === 'option_a' ? (poll.option_a_label || 'Option A') : (poll.option_b_label || 'Option B')}</strong>
          </p>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Thank you for voting! Results will update in real-time.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-semibold mb-2">
          Which do you prefer?
        </h2>
        <p className="text-muted-foreground">
          Tap your choice below
        </p>
      </div>
      
      {voteError && (
        <Alert variant="destructive">
          <AlertDescription>{voteError}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <Button
          size="lg"
          onClick={() => handleVote('option_a')}
          disabled={isVoting}
          className="h-16 sm:h-20 text-lg sm:text-xl font-semibold"
        >
          {poll.option_a_label || 'Option A'}
        </Button>
        
        <Button
          size="lg"
          variant="outline"
          onClick={() => handleVote('option_b')}
          disabled={isVoting}
          className="h-16 sm:h-20 text-lg sm:text-xl font-semibold"
        >
          {poll.option_b_label || 'Option B'}
        </Button>
      </div>
      
      {isVoting && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            <span>Submitting your vote...</span>
          </div>
        </div>
      )}
      
      <div className="text-center text-sm text-muted-foreground">
        <p>Your vote is anonymous and cannot be changed once submitted.</p>
      </div>
    </div>
  );
}
