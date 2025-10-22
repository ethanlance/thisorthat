'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Share2, ArrowLeft, RefreshCw } from 'lucide-react';
import { PollWithResults } from '@/lib/services/polls';
import { getPollStatus, isPollActive } from '@/lib/services/expiration';
import PollStatusBadge from './PollStatusBadge';
import CountdownTimer from './CountdownTimer';
import PollImages from './PollImages';
import PollVoting from './PollVoting';
import PollResults from './PollResults';
import { cn } from '@/lib/utils';

interface PollViewProps {
  poll: PollWithResults;
  onVote: (choice: 'option_a' | 'option_b') => Promise<boolean>;
  isVoting: boolean;
  hasVoted: boolean;
  userVote: 'option_a' | 'option_b' | null;
  onRefetch?: () => void;
  className?: string;
}

export default function PollView({ 
  poll, 
  onVote, 
  isVoting, 
  hasVoted, 
  userVote,
  onRefetch,
  className 
}: PollViewProps) {
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);
  
  const pollStatus = getPollStatus(poll);
  const isActive = isPollActive(poll);

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/poll/${poll.id}`;
      await navigator.clipboard.writeText(shareUrl);
      setShowSuccessMessage('Poll link copied to clipboard!');
      setTimeout(() => setShowSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className={cn('min-h-screen bg-background', className)}>
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefetch}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
          
          {/* Status and Timer */}
          <div className="flex items-center justify-between mb-4">
            <PollStatusBadge status={pollStatus} size="md" />
            {isActive && (
              <CountdownTimer 
                expiresAt={poll.expires_at} 
                className="text-sm"
              />
            )}
          </div>
          
          {/* Description */}
          {poll.description && (
            <div className="bg-muted rounded-lg p-4 mb-6">
              <p className="text-lg leading-relaxed">
                {poll.description}
              </p>
            </div>
          )}
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <Alert className="mb-6 border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
            <AlertDescription>{showSuccessMessage}</AlertDescription>
          </Alert>
        )}

        {/* Poll Images */}
        <PollImages 
          poll={poll} 
          showResults={!isActive || hasVoted}
        />

        {/* Voting Interface or Results */}
        {isActive && !hasVoted ? (
          <PollVoting
            poll={poll}
            onVote={onVote}
            isVoting={isVoting}
            hasVoted={hasVoted}
            userVote={userVote}
            onShare={handleShare}
          />
        ) : (
          <PollResults
            poll={poll}
            userVote={userVote}
            onShare={handleShare}
          />
        )}

        {/* Poll Info Footer */}
        <div className="mt-8 pt-6 border-t border-border">
          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p>
              Poll created {new Date(poll.created_at).toLocaleDateString()}
            </p>
            {isActive && (
              <p>
                Expires {new Date(poll.expires_at).toLocaleDateString()} at{' '}
                {new Date(poll.expires_at).toLocaleTimeString()}
              </p>
            )}
            <p>
              {poll.is_public ? 'Public poll' : 'Private poll'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
