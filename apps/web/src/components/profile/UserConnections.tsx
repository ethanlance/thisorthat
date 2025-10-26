'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProfileService, UserSearchResult } from '@/lib/services/profile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import FollowButton from './FollowButton';

interface UserConnectionsProps {
  userId: string;
  type: 'followers' | 'following';
}

export default function UserConnections({
  userId,
  type,
}: UserConnectionsProps) {
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const loadUsers = useCallback(
    async (reset = false) => {
      setIsLoading(true);
      try {
        const newUsers =
          type === 'followers'
            ? await ProfileService.getUserFollowers(
                userId,
                limit,
                reset ? 0 : offset
              )
            : await ProfileService.getUserFollowing(
                userId,
                limit,
                reset ? 0 : offset
              );

        if (reset) {
          setUsers(newUsers);
          setOffset(newUsers.length);
        } else {
          setUsers(prev => [...prev, ...newUsers]);
          setOffset(prev => prev + newUsers.length);
        }

        setHasMore(newUsers.length === limit);
      } catch (error) {
        console.error(`Error loading ${type}:`, error);
      } finally {
        setIsLoading(false);
      }
    },
    [userId, type, limit, offset]
  );

  useEffect(() => {
    loadUsers(true);
  }, [userId, type, loadUsers]);

  const handleLoadMore = () => {
    loadUsers(false);
  };

  if (isLoading && users.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span className="capitalize">{type}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2 text-muted-foreground">
              Loading {type}...
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
          <Users className="h-5 w-5" />
          <span className="capitalize">{type}</span>
          <Badge variant="secondary">{users.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No {type} yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map(user => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={user.avatar_url || undefined}
                      alt={user.display_name || 'User'}
                    />
                    <AvatarFallback>
                      {user.display_name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.display_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Last active{' '}
                      {formatDistanceToNow(new Date(user.last_active_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
                <FollowButton
                  userId={user.id}
                  displayName={user.display_name || undefined}
                  variant="outline"
                  size="sm"
                />
              </div>
            ))}

            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  variant="outline"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Load More
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
