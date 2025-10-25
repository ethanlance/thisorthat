'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TrendingUp,
  Fire,
  Star,
  Eye,
  Heart,
  MessageCircle,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { FeedService, FeedPoll } from '@/lib/services/feed';

interface TrendingPollsProps {
  limit?: number;
  className?: string;
  onPollSelect?: (poll: FeedPoll) => void;
}

export default function TrendingPolls({ 
  limit = 10, 
  className,
  onPollSelect 
}: TrendingPollsProps) {
  const [polls, setPolls] = useState<FeedPoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadTrendingPolls = async () => {
    try {
      setLoading(true);
      setError(null);

      const trendingPolls = await FeedService.getTrendingPolls(limit, 0);
      setPolls(trendingPolls);
    } catch (err) {
      console.error('Error loading trending polls:', err);
      setError('Failed to load trending polls');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTrendingPolls();
    setRefreshing(false);
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

  const getTrendingLevel = (trendingScore: number) => {
    if (trendingScore > 1000) return { level: 'Hot', color: 'bg-red-100 text-red-800', icon: Fire };
    if (trendingScore > 500) return { level: 'Trending', color: 'bg-orange-100 text-orange-800', icon: TrendingUp };
    if (trendingScore > 100) return { level: 'Rising', color: 'bg-yellow-100 text-yellow-800', icon: Star };
    return { level: 'New', color: 'bg-blue-100 text-blue-800', icon: TrendingUp };
  };

  useEffect(() => {
    loadTrendingPolls();
  }, [limit]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading trending polls...</span>
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
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-orange-500" />
          <h2 className="text-xl font-bold">Trending Now</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      {/* Trending Polls */}
      {polls.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No trending polls</h3>
            <p className="text-muted-foreground">
              Check back later for trending content.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {polls.map((poll, index) => {
            const trendingInfo = getTrendingLevel(poll.trending_score);
            const TrendingIcon = trendingInfo.icon;

            return (
              <Card key={poll.poll_id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    {/* Trending Rank */}
                    <div className="flex flex-col items-center space-y-1">
                      <div className="w-8 h-8 bg-orange-100 text-orange-800 rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <Badge className={trendingInfo.color}>
                        <TrendingIcon className="h-3 w-3 mr-1" />
                        {trendingInfo.level}
                      </Badge>
                    </div>

                    {/* Poll Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant="outline">
                              {formatDate(poll.created_at)}
                            </Badge>
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              <Star className="h-3 w-3 mr-1" />
                              {Math.round(poll.engagement_score)} engagement
                            </Badge>
                          </div>

                          {poll.description && (
                            <p className="text-muted-foreground mb-3 line-clamp-2">
                              {poll.description}
                            </p>
                          )}

                          {/* Poll Options Preview */}
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground">Option A</div>
                              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                                <img
                                  src={poll.option_a_image_url}
                                  alt={poll.option_a_label || 'Option A'}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              </div>
                              {poll.option_a_label && (
                                <p className="text-xs font-medium truncate">{poll.option_a_label}</p>
                              )}
                            </div>

                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground">Option B</div>
                              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                                <img
                                  src={poll.option_b_image_url}
                                  alt={poll.option_b_label || 'Option B'}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              </div>
                              {poll.option_b_label && (
                                <p className="text-xs font-medium truncate">{poll.option_b_label}</p>
                              )}
                            </div>
                          </div>

                          {/* Categories and Tags */}
                          {(poll.categories.length > 0 || poll.tags.length > 0) && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {poll.categories.slice(0, 2).map((category, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {category}
                                </Badge>
                              ))}
                              {poll.tags.slice(0, 2).map((tag, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {(poll.categories.length > 2 || poll.tags.length > 2) && (
                                <Badge variant="outline" className="text-xs">
                                  +{poll.categories.length + poll.tags.length - 2} more
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Engagement Stats */}
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Eye className="h-3 w-3" />
                              <span>{Math.floor(poll.engagement_score / 10)} views</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Heart className="h-3 w-3" />
                              <span>{Math.floor(poll.engagement_score / 2)} votes</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MessageCircle className="h-3 w-3" />
                              <span>{Math.floor(poll.engagement_score / 5)} comments</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <TrendingUp className="h-3 w-3" />
                              <span>{Math.round(poll.trending_score)} trending</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPollSelect?.(poll)}
                          >
                            View Poll
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
