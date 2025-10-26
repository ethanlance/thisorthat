'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  WifiOff,
  Database,
  AlertCircle,
  CheckCircle,
  Vote,
  Calendar,
} from 'lucide-react';
import {
  OfflineStorage,
  OfflinePoll,
  OfflineVote,
} from '@/lib/offline/OfflineStorage';
import { cn } from '@/lib/utils';

interface OfflinePollViewerProps {
  pollId: string;
  className?: string;
}

export function OfflinePollViewer({
  pollId,
  className,
}: OfflinePollViewerProps) {
  const [poll, setPoll] = useState<OfflinePoll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userVote, setUserVote] = useState<'option_a' | 'option_b' | null>(
    null
  );
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const offlineStorage = OfflineStorage.getInstance();

  const checkNetworkStatus = useCallback(() => {
    setIsOffline(!navigator.onLine);
  }, []);

  const loadPoll = useCallback(async () => {
    try {
      setLoading(true);
      const cachedPoll = await offlineStorage.getCachedPoll(pollId);

      if (cachedPoll) {
        setPoll(cachedPoll);

        // Check if user has voted on this poll
        const votes = await offlineStorage.getOfflineVotes(pollId);
        const userVotes = votes.filter(v => v.synced || !isOffline);
        if (userVotes.length > 0) {
          setUserVote(userVotes[0].choice);
        }
      } else {
        setError('Poll not available offline');
      }
    } catch (err) {
      setError('Failed to load poll');
      console.error('Error loading poll:', err);
    } finally {
      setLoading(false);
    }
  }, [pollId, offlineStorage, isOffline]);

  useEffect(() => {
    loadPoll();
    checkNetworkStatus();
  }, [pollId, loadPoll, checkNetworkStatus]);

  const handleVote = useCallback(
    async (choice: 'option_a' | 'option_b') => {
      if (!poll) return;

      try {
        // Create offline vote
        const vote: OfflineVote = {
          id: `offline_${Date.now()}_${Math.random()}`,
          poll_id: poll.id,
          choice,
          user_id: undefined, // Will be set when synced
          anonymous_id: `anon_${Date.now()}`,
          created_at: new Date().toISOString(),
          synced: false,
        };

        await offlineStorage.saveOfflineVote(vote);
        setUserVote(choice);

        // Update local vote counts optimistically
        const updatedPoll = { ...poll };
        if (choice === 'option_a') {
          updatedPoll.option_a_votes += 1;
        } else {
          updatedPoll.option_b_votes += 1;
        }
        updatedPoll.votes_count += 1;
        setPoll(updatedPoll);
      } catch (err) {
        console.error('Error saving vote:', err);
      }
    },
    [poll, offlineStorage]
  );

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getPercentage = (votes: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !poll) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Poll not available offline'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const optionAPercentage = getPercentage(
    poll.option_a_votes,
    poll.votes_count
  );
  const optionBPercentage = getPercentage(
    poll.option_b_votes,
    poll.votes_count
  );

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">{poll.title}</CardTitle>
            {poll.description && (
              <CardDescription>{poll.description}</CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isOffline && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <WifiOff className="h-3 w-3" />
                Offline
              </Badge>
            )}
            <Badge variant="outline" className="flex items-center gap-1">
              <Database className="h-3 w-3" />
              Cached
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Poll Options */}
        <div className="space-y-3">
          {/* Option A */}
          <div className="relative">
            <Button
              variant={userVote === 'option_a' ? 'default' : 'outline'}
              className={cn(
                'w-full h-24 p-4 text-left justify-start',
                userVote === 'option_a' && 'ring-2 ring-primary'
              )}
              onClick={() => !userVote && handleVote('option_a')}
              disabled={!!userVote}
            >
              <div className="flex-1">
                <div className="text-lg font-medium">{poll.option_a}</div>
                <div className="text-sm opacity-75">
                  {poll.option_a_votes} votes ({optionAPercentage}%)
                </div>
              </div>
              {userVote === 'option_a' && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
            </Button>
            {userVote && (
              <div className="absolute inset-0 pointer-events-none">
                <Progress value={optionAPercentage} className="h-full" />
              </div>
            )}
          </div>

          {/* Option B */}
          <div className="relative">
            <Button
              variant={userVote === 'option_b' ? 'default' : 'outline'}
              className={cn(
                'w-full h-24 p-4 text-left justify-start',
                userVote === 'option_b' && 'ring-2 ring-primary'
              )}
              onClick={() => !userVote && handleVote('option_b')}
              disabled={!!userVote}
            >
              <div className="flex-1">
                <div className="text-lg font-medium">{poll.option_b}</div>
                <div className="text-sm opacity-75">
                  {poll.option_b_votes} votes ({optionBPercentage}%)
                </div>
              </div>
              {userVote === 'option_b' && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
            </Button>
            {userVote && (
              <div className="absolute inset-0 pointer-events-none">
                <Progress value={optionBPercentage} className="h-full" />
              </div>
            )}
          </div>
        </div>

        {/* Poll Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Vote className="h-4 w-4" />
            <span>{poll.votes_count} total votes</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{formatTimeAgo(poll.cached_at)}</span>
          </div>
        </div>

        {/* Offline Notice */}
        {isOffline && (
          <Alert>
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              You&apos;re viewing this poll offline. Your vote will be synced
              when you&apos;re back online.
            </AlertDescription>
          </Alert>
        )}

        {/* Sync Notice */}
        {userVote && !isOffline && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Your vote has been recorded and will be synced automatically.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
