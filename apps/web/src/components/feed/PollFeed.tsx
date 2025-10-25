'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DiscoveryService, PollFeedItem } from '@/lib/services/discovery';

interface FeedPollData {
  id: string;
  title: string;
  description: string | null;
  option_a_label: string | null;
  option_b_label: string | null;
  option_a_image_url: string;
  option_b_image_url: string;
  user_id: string;
  created_at: string;
  expires_at: string | null;
  vote_count: number;
  comment_count: number;
  vote_counts: {
    option_a: number;
    option_b: number;
  };
  user_vote?: 'option_a' | 'option_b' | null;
}
import PollCard from '@/components/poll/PollCard';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, Users, Clock } from 'lucide-react';

interface PollFeedProps {
  feedType?: 'personalized' | 'trending' | 'popular' | 'recent';
  limit?: number;
  showFilters?: boolean;
  className?: string;
}

export default function PollFeed({
  feedType = 'personalized',
  limit = 20,
  showFilters = true,
  className = '',
}: PollFeedProps) {
  const { user } = useAuth();
  const [polls, setPolls] = useState<PollFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadPolls = useCallback(
    async (reset = false) => {
      if (!user) return;

      try {
        if (reset) {
          setIsLoading(true);
          setOffset(0);
        } else {
          setIsLoadingMore(true);
        }

        const currentOffset = reset ? 0 : offset;
        let newPolls: PollFeedItem[] = [];

        switch (feedType) {
          case 'trending':
            newPolls = await DiscoveryService.getTrendingPolls(
              limit,
              currentOffset
            );
            break;
          case 'popular':
            newPolls = await DiscoveryService.getPopularPolls(
              limit,
              currentOffset
            );
            break;
          case 'personalized':
          default:
            newPolls = await DiscoveryService.getPersonalizedFeed(
              user.id,
              limit,
              currentOffset
            );
            break;
        }

        if (reset) {
          setPolls(newPolls);
        } else {
          setPolls(prev => [...prev, ...newPolls]);
        }

        setHasMore(newPolls.length === limit);
        setOffset(currentOffset + newPolls.length);
        setError(null);
      } catch (err) {
        console.error('Error loading polls:', err);
        setError('Failed to load polls');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [user, feedType, limit, offset]
  );

  const handleRefresh = useCallback(() => {
    loadPolls(true);
  }, [loadPolls]);

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      loadPolls(false);
    }
  }, [isLoadingMore, hasMore, loadPolls]);

  const handlePollInteraction = useCallback(
    async (pollId: string, interactionType: string) => {
      if (!user) return;

      try {
        await DiscoveryService.trackInteraction(
          user.id,
          pollId,
          interactionType as
            | 'view'
            | 'vote'
            | 'comment'
            | 'share'
            | 'save'
            | 'hide'
            | 'report',
          { timestamp: new Date().toISOString() }
        );
      } catch (err) {
        console.error('Error tracking interaction:', err);
      }
    },
    [user]
  );

  useEffect(() => {
    loadPolls(true);
  }, [loadPolls]);

  const getFeedTitle = () => {
    switch (feedType) {
      case 'trending':
        return 'Trending Polls';
      case 'popular':
        return 'Popular Polls';
      case 'recent':
        return 'Recent Polls';
      case 'personalized':
      default:
        return 'Your Feed';
    }
  };

  const getFeedIcon = () => {
    switch (feedType) {
      case 'trending':
        return <TrendingUp className="h-5 w-5" />;
      case 'popular':
        return <Users className="h-5 w-5" />;
      case 'recent':
        return <Clock className="h-5 w-5" />;
      case 'personalized':
      default:
        return <RefreshCw className="h-5 w-5" />;
    }
  };

  if (!user) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-muted-foreground">
          Please log in to view your personalized feed
        </p>
      </div>
    );
  }

  if (isLoading && polls.length === 0) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <LoadingSpinner text="Loading your feed..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Feed Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          {getFeedIcon()}
          <h2 className="text-2xl font-bold">{getFeedTitle()}</h2>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Polls List */}
      {polls.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">No polls found</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {polls.map(poll => (
            <div key={poll.poll_id} className="relative">
              <PollCard
                poll={{
                  id: poll.poll_id,
                  creator_id: poll.user_id,
                  option_a_image_url: poll.option_a_image_url || '',
                  option_a_label: poll.option_a_label,
                  option_b_image_url: poll.option_b_image_url || '',
                  option_b_label: poll.option_b_label,
                  description: poll.poll_description,
                  expires_at: poll.expires_at || '',
                  is_public: true,
                  status: 'active' as const,
                  privacy_level: 'public' as const,
                  friend_group_id: null,
                  access_expires_at: null,
                  created_at: poll.created_at,
                  updated_at: poll.created_at,
                  vote_counts: {
                    option_a: Math.floor(poll.vote_count * 0.6), // Mock data
                    option_b: Math.floor(poll.vote_count * 0.4), // Mock data
                  },
                  user_vote: null,
                  share_count: 0,
                  last_activity: poll.created_at,
                }}
                onView={() => handlePollInteraction(poll.poll_id, 'view')}
                onShare={() => handlePollInteraction(poll.poll_id, 'share')}
              />

              {/* Feed-specific metadata */}
              <div className="mt-2 flex items-center space-x-4 text-sm text-muted-foreground">
                {poll.categories.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <span>Categories:</span>
                    <div className="flex space-x-1">
                      {poll.categories.slice(0, 2).map(category => (
                        <span
                          key={category}
                          className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs"
                        >
                          {category}
                        </span>
                      ))}
                      {poll.categories.length > 2 && (
                        <span className="text-xs">
                          +{poll.categories.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {poll.tags.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <span>Tags:</span>
                    <div className="flex space-x-1">
                      {poll.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                      {poll.tags.length > 3 && (
                        <span className="text-xs">
                          +{poll.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-6">
              <Button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                variant="outline"
                size="lg"
              >
                {isLoadingMore ? (
                  <>
                    <LoadingSpinner className="h-4 w-4 mr-2" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
