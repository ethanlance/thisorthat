'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Share2, Trash2, Eye, Users, Clock } from 'lucide-react';
import { UserPollSummary } from '@/lib/services/dashboard';
import { getPollStatus, isPollActive } from '@/lib/services/expiration';
import { formatRelativeTime } from '@/lib/utils/time-helpers';
import PollStatusBadge from './PollStatusBadge';
import CountdownTimer from './CountdownTimer';
import PollActions from './PollActions';
import { cn } from '@/lib/utils';

interface PollCardProps {
  poll: UserPollSummary;
  onDelete?: (pollId: string) => void;
  onShare?: (pollId: string) => void;
  onView?: (pollId: string) => void;
  className?: string;
}

export default function PollCard({ 
  poll, 
  onDelete, 
  onShare, 
  onView,
  className 
}: PollCardProps) {
  const [showActions, setShowActions] = useState(false);
  
  const pollStatus = getPollStatus(poll);
  const isActive = isPollActive(poll);
  const totalVotes = poll.vote_counts.option_a + poll.vote_counts.option_b;
  const optionAPercentage = totalVotes > 0 ? Math.round((poll.vote_counts.option_a / totalVotes) * 100) : 0;
  const optionBPercentage = totalVotes > 0 ? Math.round((poll.vote_counts.option_b / totalVotes) * 100) : 0;

  const handleView = () => {
    if (onView) {
      onView(poll.id);
    } else {
      window.open(`/poll/${poll.id}`, '_blank');
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.clipboard) {
        const shareUrl = `${window.location.origin}/poll/${poll.id}`;
        await navigator.clipboard.writeText(shareUrl);
        onShare?.(poll.id);
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleDelete = () => {
    onDelete?.(poll.id);
  };

  return (
    <Card className={cn('group hover:shadow-md transition-shadow', className)}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <PollStatusBadge status={pollStatus} size="sm" />
              {isActive && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              )}
            </div>
            
            {poll.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {poll.description}
              </p>
            )}
          </div>
          
          <PollActions
            poll={poll}
            onDelete={handleDelete}
            onShare={handleShare}
            onView={handleView}
          />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Poll Images */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-center">
            <div className="relative">
              <img
                src={poll.option_a_image_url}
                alt={poll.option_a_label || 'Option A'}
                className="w-full h-20 object-cover rounded-lg border"
              />
              {!isActive && (
                <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {optionAPercentage}%
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs font-medium mt-1 line-clamp-1">
              {poll.option_a_label || 'Option A'}
            </p>
          </div>
          
          <div className="text-center">
            <div className="relative">
              <img
                src={poll.option_b_image_url}
                alt={poll.option_b_label || 'Option B'}
                className="w-full h-20 object-cover rounded-lg border"
              />
              {!isActive && (
                <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {optionBPercentage}%
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs font-medium mt-1 line-clamp-1">
              {poll.option_b_label || 'Option B'}
            </p>
          </div>
        </div>

        {/* Poll Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{totalVotes} votes</span>
            </div>
            {poll.share_count && poll.share_count > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Share2 className="h-3 w-3" />
                <span>{poll.share_count}</span>
              </div>
            )}
          </div>

          {/* Vote Results Bar */}
          {!isActive && totalVotes > 0 && (
            <div className="w-full bg-muted rounded-full h-2">
              <div className="flex h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500"
                  style={{ width: `${optionAPercentage}%` }}
                />
                <div
                  className="bg-red-500"
                  style={{ width: `${optionBPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Countdown Timer */}
          {isActive && (
            <div className="flex items-center justify-between">
              <CountdownTimer 
                expiresAt={poll.expires_at} 
                compact 
                className="text-xs"
              />
            </div>
          )}

          {/* Last Activity */}
          {poll.last_activity && (
            <p className="text-xs text-muted-foreground">
              Last activity: {formatRelativeTime(poll.last_activity)}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleView}
            className="flex-1"
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="flex-1"
          >
            <Share2 className="h-3 w-3 mr-1" />
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
