'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Search,
  Users,
  UserPlus,
  UserMinus,
  Loader2,
  AlertTriangle,
  Globe,
  Lock,
  Star,
  TrendingUp,
} from 'lucide-react';
import { ProfileService, UserSearchResult } from '@/lib/services/profile';
import { useAuth } from '@/contexts/AuthContext';

interface UserSearchProps {
  onUserSelect?: (user: UserSearchResult) => void;
  className?: string;
}

export default function UserSearch({
  onUserSelect,
  className,
}: UserSearchProps) {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followingStatus, setFollowingStatus] = useState<
    Record<string, boolean>
  >({});

  // Debounce search
  const debouncedSearch = useCallback(
    debounce(async (term: string) => {
      if (term.trim().length < 2) {
        setUsers([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const results = await ProfileService.searchUsers(term.trim());
        setUsers(results);

        // Check following status for each user
        if (currentUser) {
          const statusPromises = results.map(async user => {
            const isFollowing = await ProfileService.isFollowing(
              currentUser.id,
              user.id
            );
            return { userId: user.id, isFollowing };
          });

          const statuses = await Promise.all(statusPromises);
          const statusMap = statuses.reduce(
            (acc, { userId, isFollowing }) => {
              acc[userId] = isFollowing;
              return acc;
            },
            {} as Record<string, boolean>
          );

          setFollowingStatus(statusMap);
        }
      } catch (err) {
        console.error('Error searching users:', err);
        setError('Failed to search users');
      } finally {
        setLoading(false);
      }
    }, 300),
    [currentUser]
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  const handleFollow = async (userId: string) => {
    if (!currentUser) return;

    try {
      const isFollowing = followingStatus[userId];

      if (isFollowing) {
        const success = await ProfileService.unfollowUser(userId);
        if (success) {
          setFollowingStatus(prev => ({ ...prev, [userId]: false }));
          setUsers(prev =>
            prev.map(user =>
              user.id === userId
                ? { ...user, followers_count: user.followers_count - 1 }
                : user
            )
          );
        }
      } else {
        const success = await ProfileService.followUser(userId);
        if (success) {
          setFollowingStatus(prev => ({ ...prev, [userId]: true }));
          setUsers(prev =>
            prev.map(user =>
              user.id === userId
                ? { ...user, followers_count: user.followers_count + 1 }
                : user
            )
          );
        }
      }
    } catch (err) {
      console.error('Error toggling follow status:', err);
    }
  };

  const getPrivacyIcon = (level: string) => {
    switch (level) {
      case 'public':
        return <Globe className="h-4 w-4" />;
      case 'friends':
        return <Users className="h-4 w-4" />;
      case 'private':
        return <Lock className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  const getPrivacyColor = (level: string) => {
    switch (level) {
      case 'public':
        return 'bg-green-100 text-green-800';
      case 'friends':
        return 'bg-blue-100 text-blue-800';
      case 'private':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Discover Users</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for users by name, bio, or interests..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Enter at least 2 characters to start searching
          </p>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Searching users...</span>
        </div>
      )}

      {/* Search Results */}
      {!loading && searchTerm.trim().length >= 2 && (
        <div className="space-y-4">
          {users.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
                <p className="text-muted-foreground">
                  Try searching with different keywords or check your spelling.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Found {users.length} user{users.length !== 1 ? 's' : ''}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map(user => (
                  <Card
                    key={user.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback>
                            {user.display_name
                              ? getInitials(user.display_name)
                              : 'U'}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold truncate">
                                {user.display_name || 'Anonymous User'}
                              </h4>
                              {user.bio && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                  {user.bio}
                                </p>
                              )}
                            </div>
                            <Badge
                              className={getPrivacyColor(user.privacy_level)}
                            >
                              {getPrivacyIcon(user.privacy_level)}
                            </Badge>
                          </div>

                          <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <TrendingUp className="h-3 w-3" />
                              <span>{user.polls_created} polls</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Users className="h-3 w-3" />
                              <span>{user.followers_count} followers</span>
                            </div>
                          </div>

                          {user.interests && user.interests.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {user.interests
                                .slice(0, 3)
                                .map((interest, index) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {interest}
                                  </Badge>
                                ))}
                              {user.interests.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{user.interests.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-muted-foreground">
                              Active {formatDate(user.last_active_at)}
                            </span>
                            <div className="flex space-x-2">
                              {onUserSelect && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onUserSelect(user)}
                                >
                                  View Profile
                                </Button>
                              )}
                              {currentUser && currentUser.id !== user.id && (
                                <Button
                                  size="sm"
                                  variant={
                                    followingStatus[user.id]
                                      ? 'outline'
                                      : 'default'
                                  }
                                  onClick={() => handleFollow(user.id)}
                                >
                                  {followingStatus[user.id] ? (
                                    <UserMinus className="h-3 w-3 mr-1" />
                                  ) : (
                                    <UserPlus className="h-3 w-3 mr-1" />
                                  )}
                                  {followingStatus[user.id]
                                    ? 'Unfollow'
                                    : 'Follow'}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && searchTerm.trim().length < 2 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Search for Users</h3>
            <p className="text-muted-foreground">
              Enter a name, bio, or interest to discover other users on the
              platform.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Debounce utility function
function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
