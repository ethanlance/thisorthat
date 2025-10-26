'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProfileService, type UserActivityData } from '@/lib/services/profile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Vote,
  Plus,
  MessageSquare,
  Users,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UserActivityProps {
  userId: string;
}

const activityIcons = {
  poll_created: Plus,
  poll_voted: Vote,
  comment_added: MessageSquare,
  user_followed: Users,
  achievement_earned: Activity,
};

const activityColors = {
  poll_created: 'bg-blue-100 text-blue-800',
  poll_voted: 'bg-green-100 text-green-800',
  comment_added: 'bg-purple-100 text-purple-800',
  user_followed: 'bg-orange-100 text-orange-800',
  achievement_earned: 'bg-yellow-100 text-yellow-800',
};

export default function UserActivity({ userId }: UserActivityProps) {
  const [activities, setActivities] = useState<UserActivityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const loadActivities = useCallback(
    async (reset = false) => {
      try {
        setIsLoading(true);
        const newActivities = await ProfileService.getUserActivity(
          userId,
          limit,
          reset ? 0 : offset
        );

        if (reset) {
          setActivities(newActivities);
          setOffset(newActivities.length);
        } else {
          setActivities(prev => [...prev, ...newActivities]);
          setOffset(prev => prev + newActivities.length);
        }

        setHasMore(newActivities.length === limit);
      } catch (error) {
        console.error('Error loading activities:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [userId, limit, offset]
  );

  useEffect(() => {
    loadActivities(true);
  }, [userId, loadActivities]);

  const handleLoadMore = () => {
    loadActivities(false);
  };

  if (isLoading && activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2 text-muted-foreground">
              Loading activity...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <span>Recent Activity</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map(activity => {
              const IconComponent =
                activityIcons[
                  activity.activity_type as keyof typeof activityIcons
                ] || Activity;
              const colorClass =
                activityColors[
                  activity.activity_type as keyof typeof activityColors
                ] || 'bg-gray-100 text-gray-800';

              return (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className={`p-2 rounded-full ${colorClass}`}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {(activity.activity_data?.description as string) ||
                        `${activity.activity_type.replace('_', ' ')}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                    {(activity.activity_data?.metadata as Record<
                      string,
                      unknown
                    >) && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {Object.entries(
                          activity.activity_data?.metadata as Record<
                            string,
                            unknown
                          >
                        ).map(([key, value]) => (
                          <Badge
                            key={key}
                            variant="outline"
                            className="text-xs"
                          >
                            {key}: {String(value)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {hasMore && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin inline" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
