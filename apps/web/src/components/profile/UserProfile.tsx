'use client';

import { useState, useEffect } from 'react';
import { User, Calendar, Users, BarChart3, Heart } from 'lucide-react';
import { ProfileData } from '@/lib/services/profile';
import { ProfileService } from '@/lib/services/profile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import FollowButton from './FollowButton';
import UserConnections from './UserConnections';
import UserAchievements from './UserAchievements';
import UserActivity from './UserActivity';

interface UserProfileProps {
  userId: string;
  isOwnProfile?: boolean;
}

export default function UserProfile({
  userId,
  isOwnProfile = false,
}: UserProfileProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const profileData = await ProfileService.getUserProfile(userId);
      setProfile(profileData);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="h-20 w-20 bg-muted rounded-full animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-32 bg-muted rounded animate-pulse" />
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={profile.avatar_url || ''}
                  alt={profile.display_name || 'User'}
                />
                <AvatarFallback className="text-lg">
                  {profile.display_name?.charAt(0) ||
                    profile.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h1 className="text-2xl font-bold">
                  {profile.display_name || 'Anonymous User'}
                </h1>
                <p className="text-muted-foreground">{profile.email}</p>
                {profile.bio && (
                  <p className="text-sm text-muted-foreground max-w-md">
                    {profile.bio}
                  </p>
                )}
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Joined {formatDistanceToNow(new Date(profile.created_at))}{' '}
                    ago
                  </span>
                </div>
              </div>
            </div>
            {!isOwnProfile && (
              <FollowButton
                userId={userId}
                displayName={profile.display_name || undefined}
                className="min-w-[100px]"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">
                {profile.polls_created}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Polls Created</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Heart className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{profile.polls_voted}</span>
            </div>
            <p className="text-sm text-muted-foreground">Votes Cast</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">
                {profile.followers_count}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Followers</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <User className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">
                {profile.following_count}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Following</p>
          </CardContent>
        </Card>
      </div>

      {/* Interests */}
      {profile.interests && profile.interests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Interests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest, index) => (
                <Badge key={index} variant="secondary">
                  {interest}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Privacy Level */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Privacy Level:</span>
            <Badge
              variant={
                profile.privacy_level === 'public' ? 'default' : 'secondary'
              }
            >
              {profile.privacy_level}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Connections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UserConnections userId={userId} type="followers" />
        <UserConnections userId={userId} type="following" />
      </div>

      {/* Achievements and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UserAchievements userId={userId} />
        <UserActivity userId={userId} />
      </div>
    </div>
  );
}
