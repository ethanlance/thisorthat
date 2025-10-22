'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Share2, Users, TrendingUp } from 'lucide-react';
import { PollWithResults } from '@/lib/services/polls';
import { cn } from '@/lib/utils';

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
  className 
}: PollResultsProps) {
  const totalVotes = poll.vote_counts.option_a + poll.vote_counts.option_b;
  const optionAPercentage = totalVotes > 0 ? Math.round((poll.vote_counts.option_a / totalVotes) * 100) : 0;
  const optionBPercentage = totalVotes > 0 ? Math.round((poll.vote_counts.option_b / totalVotes) * 100) : 0;

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
      {/* Results Header */}
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-semibold mb-2">
          Poll Results
        </h2>
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{totalVotes} vote{totalVotes !== 1 ? 's' : ''} total</span>
        </div>
      </div>

      {/* Results Cards */}
      <div className="space-y-4">
        {/* Option A Results */}
        <Card className={cn(
          'relative overflow-hidden',
          userVote === 'option_a' && 'ring-2 ring-primary'
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">
                {poll.option_a_label || 'Option A'}
              </h3>
              <div className="text-right">
                <div className="text-2xl font-bold">{optionAPercentage}%</div>
                <div className="text-sm text-muted-foreground">
                  {poll.vote_counts.option_a} vote{poll.vote_counts.option_a !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${optionAPercentage}%` }}
              />
            </div>
            
            {userVote === 'option_a' && (
              <div className="absolute top-2 right-2">
                <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                  Your vote
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Option B Results */}
        <Card className={cn(
          'relative overflow-hidden',
          userVote === 'option_b' && 'ring-2 ring-primary'
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">
                {poll.option_b_label || 'Option B'}
              </h3>
              <div className="text-right">
                <div className="text-2xl font-bold">{optionBPercentage}%</div>
                <div className="text-sm text-muted-foreground">
                  {poll.vote_counts.option_b} vote{poll.vote_counts.option_b !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className="bg-red-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${optionBPercentage}%` }}
              />
            </div>
            
            {userVote === 'option_b' && (
              <div className="absolute top-2 right-2">
                <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                  Your vote
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Share Button */}
      <div className="text-center">
        <Button
          onClick={handleShare}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Share2 className="h-4 w-4" />
          Share Results
        </Button>
      </div>

      {/* Additional Stats */}
      {totalVotes > 0 && (
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-muted rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-600">
              {poll.vote_counts.option_a}
            </div>
            <div className="text-sm text-muted-foreground">
              {poll.option_a_label || 'Option A'}
            </div>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <div className="text-2xl font-bold text-red-600">
              {poll.vote_counts.option_b}
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
