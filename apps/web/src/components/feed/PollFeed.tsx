'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  RefreshCw,
  TrendingUp,
  Heart,
  Share2,
  Bookmark,
  Eye,
  MessageCircle,
  MoreHorizontal,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { FeedService, FeedPoll } from '@/lib/services/feed';

interface PollFeedProps {
  feedType?: 'personalized' | 'trending' | 'recommendations' | 'saved';
  className?: string;
  onPollSelect?: (poll: FeedPoll) => void;
}

export default function PollFeed({
  feedType = 'personalized',
  className,
  onPollSelect,
}: PollFeedProps) {
  const [polls, setPolls] = useState<FeedPoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const limit = 20;

  const loadPolls = useCallback(
    async (reset = false) => {
      try {
        if (reset) {
          setLoading(true);
          setOffset(0);
          setPolls([]);
          setError(null);
        } else {
          setLoadingMore(true);
        }

        const currentOffset = reset ? 0 : offset;
        let newPolls: FeedPoll[] = [];

        switch (feedType) {
          case 'trending':
            newPolls = await FeedService.getTrendingPolls(limit, currentOffset);
            break;
          case 'recommendations':
            newPolls = await FeedService.getRecommendations(
              limit,
              currentOffset
            );
            break;
          case 'saved':
            newPolls = await FeedService.getSavedPolls(limit, currentOffset);
            break;
          default:
            newPolls = await FeedService.getPersonalizedFeed(
              limit,
              currentOffset
            );
        }

        if (reset) {
          setPolls(newPolls);
        } else {
          setPolls(prev => [...prev, ...newPolls]);
        }

        setHasMore(newPolls.length === limit);
        setOffset(currentOffset + newPolls.length);
      } catch (err) {
        console.error('Error loading polls:', err);
        setError('Failed to load polls');
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [feedType, offset, limit]
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPolls(true);
  }, [loadPolls]);

  const handleLoadMore = useCallback(async () => {
    if (!loadingMore && hasMore) {
      await loadPolls(false);
    }
  }, [loadPolls, loadingMore, hasMore]);

  const handlePollInteraction = async (
    pollId: string,
    interactionType: string
  ) => {
    try {
      await FeedService.trackInteraction(
        pollId,
        interactionType as 'view' | 'vote' | 'share' | 'comment' | 'save'
      );

      // Update local state to reflect interaction
      setPolls(prev =>
        prev.map(poll => {
          if (poll.poll_id === pollId) {
            switch (interactionType) {
              case 'save':
                return { ...poll, engagement_score: poll.engagement_score + 1 };
              case 'share':
                return { ...poll, engagement_score: poll.engagement_score + 3 };
              default:
                return poll;
            }
          }
          return poll;
        })
      );
    } catch (err) {
      console.error('Error tracking interaction:', err);
    }
  };

  const handleSavePoll = async (pollId: string) => {
    try {
      await FeedService.savePoll(pollId);
      await handlePollInteraction(pollId, 'save');
    } catch (err) {
      console.error('Error saving poll:', err);
    }
  };

  const handleHidePoll = async (pollId: string) => {
    try {
      await FeedService.hidePoll(pollId, 'User hidden');
      setPolls(prev => prev.filter(poll => poll.poll_id !== pollId));
    } catch (err) {
      console.error('Error hiding poll:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getFeedTitle = () => {
    switch (feedType) {
      case 'trending':
        return 'Trending Polls';
      case 'recommendations':
        return 'Recommended for You';
      case 'saved':
        return 'Saved Polls';
      default:
        return 'Your Feed';
    }
  };

  const getFeedDescription = () => {
    switch (feedType) {
      case 'trending':
        return "Discover what's popular right now";
      case 'recommendations':
        return "Polls we think you'll love";
      case 'saved':
        return "Polls you've saved for later";
      default:
        return 'Your personalized poll feed';
    }
  };

  useEffect(() => {
    loadPolls(true);
  }, [feedType, loadPolls]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading {getFeedTitle().toLowerCase()}...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Feed Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{getFeedTitle()}</h2>
          <p className="text-muted-foreground">{getFeedDescription()}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            <span className="ml-2">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Polls List */}
      {polls.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No polls found</h3>
              <p>Try refreshing or check back later for new content.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {polls.map(poll => (
            <Card
              key={poll.poll_id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant="outline">
                        {formatDate(poll.created_at)}
                      </Badge>
                      {poll.trending_score > 0 && (
                        <Badge
                          variant="secondary"
                          className="bg-orange-100 text-orange-800"
                        >
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Trending
                        </Badge>
                      )}
                      {poll.engagement_score > 100 && (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800"
                        >
                          <Heart className="h-3 w-3 mr-1" />
                          Popular
                        </Badge>
                      )}
                    </div>

                    {poll.description && (
                      <p className="text-muted-foreground mb-4">
                        {poll.description}
                      </p>
                    )}

                    {/* Poll Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">
                          Option A
                        </div>
                        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                          <Image
                            src={poll.option_a_image_url}
                            alt={poll.option_a_label || 'Option A'}
                            fill
                            className="object-cover rounded-lg"
                          />
                        </div>
                        {poll.option_a_label && (
                          <p className="text-sm font-medium">
                            {poll.option_a_label}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">
                          Option B
                        </div>
                        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                          <Image
                            src={poll.option_b_image_url}
                            alt={poll.option_b_label || 'Option B'}
                            fill
                            className="object-cover rounded-lg"
                          />
                        </div>
                        {poll.option_b_label && (
                          <p className="text-sm font-medium">
                            {poll.option_b_label}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Categories and Tags */}
                    {(poll.categories.length > 0 || poll.tags.length > 0) && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {poll.categories.map((category, idx) => (
                          <Badge key={idx} variant="outline">
                            {category}
                          </Badge>
                        ))}
                        {poll.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Engagement Stats */}
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center space-x-1">
                        <Eye className="h-4 w-4" />
                        <span>
                          {Math.floor(poll.engagement_score / 10)} views
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Heart className="h-4 w-4" />
                        <span>
                          {Math.floor(poll.engagement_score / 2)} votes
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="h-4 w-4" />
                        <span>
                          {Math.floor(poll.engagement_score / 5)} comments
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPollSelect?.(poll)}
                    >
                      View Poll
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSavePoll(poll.poll_id)}
                    >
                      <Bookmark className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handlePollInteraction(poll.poll_id, 'share')
                      }
                    >
                      <Share2 className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleHidePoll(poll.poll_id)}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleLoadMore}
                disabled={loadingMore}
                variant="outline"
              >
                {loadingMore ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Load More
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
