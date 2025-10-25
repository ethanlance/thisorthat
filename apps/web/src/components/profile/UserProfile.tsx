'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  User,
  Mail,
  Calendar,
  Users,
  Vote,
  TrendingUp,
  Shield,
  Globe,
  Lock,
  UserPlus,
  UserMinus,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Star,
  Award,
} from 'lucide-react';
import { ProfileService, UserProfileData } from '@/lib/services/profile';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfileProps {
  userId: string;
  className?: string;
}

export default function UserProfile({ userId, className }: UserProfileProps) {
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    loadProfile();
  }, [userId]);

  useEffect(() => {
    if (profile && currentUser && !isOwnProfile) {
      checkFollowingStatus();
    }
  }, [profile, currentUser, isOwnProfile]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const profileData = await ProfileService.getUserProfile(userId);

      if (!profileData) {
        setError('Profile not found');
        return;
      }

      setProfile(profileData);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const checkFollowingStatus = async () => {
    if (!currentUser || !profile) return;

    try {
      const following = await ProfileService.isFollowing(
        currentUser.id,
        profile.id
      );
      setIsFollowing(following);
    } catch (err) {
      console.error('Error checking following status:', err);
    }
  };

  const handleFollow = async () => {
    if (!currentUser || !profile) return;

    try {
      setActionLoading(true);

      if (isFollowing) {
        const success = await ProfileService.unfollowUser(profile.id);
        if (success) {
          setIsFollowing(false);
          setProfile(prev =>
            prev
              ? {
                  ...prev,
                  followers_count: prev.followers_count - 1,
                }
              : null
          );
        }
      } else {
        const success = await ProfileService.followUser(profile.id);
        if (success) {
          setIsFollowing(true);
          setProfile(prev =>
            prev
              ? {
                  ...prev,
                  followers_count: prev.followers_count + 1,
                }
              : null
          );
        }
      }
    } catch (err) {
      console.error('Error toggling follow status:', err);
    } finally {
      setActionLoading(false);
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
        return <Shield className="h-4 w-4" />;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading profile...</span>
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

  if (!profile) {
    return (
      <Alert>
        <AlertDescription>Profile not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start space-x-6">
            {/* Avatar */}
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-2xl">
                {profile.display_name ? getInitials(profile.display_name) : 'U'}
              </AvatarFallback>
            </Avatar>

            {/* Profile Info */}
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold">
                    {profile.display_name || 'Anonymous User'}
                  </h1>
                  {profile.bio && (
                    <p className="text-muted-foreground mt-2">{profile.bio}</p>
                  )}
                </div>

                {/* Privacy Badge */}
                <Badge className={getPrivacyColor(profile.privacy_level)}>
                  {getPrivacyIcon(profile.privacy_level)}
                  <span className="ml-1 capitalize">
                    {profile.privacy_level}
                  </span>
                </Badge>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {profile.polls_created}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Polls Created
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {profile.polls_voted}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Votes Cast
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {profile.followers_count}
                  </div>
                  <div className="text-sm text-muted-foreground">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {profile.following_count}
                  </div>
                  <div className="text-sm text-muted-foreground">Following</div>
                </div>
              </div>

              {/* Action Buttons */}
              {!isOwnProfile && currentUser && (
                <div className="flex space-x-2">
                  <Button
                    onClick={handleFollow}
                    disabled={actionLoading}
                    variant={isFollowing ? 'outline' : 'default'}
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : isFollowing ? (
                      <UserMinus className="h-4 w-4 mr-2" />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-2" />
                    )}
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interests */}
      {profile.interests && profile.interests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5" />
              <span>Interests</span>
            </CardTitle>
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

      {/* Profile Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Profile Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Email</div>
                <div className="text-sm text-muted-foreground">
                  {profile.email}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Joined</div>
                <div className="text-sm text-muted-foreground">
                  {formatDate(profile.created_at)}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Last Active</div>
                <div className="text-sm text-muted-foreground">
                  {formatDate(profile.last_active_at)}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Profile Status</div>
                <div className="text-sm text-muted-foreground">
                  {profile.profile_completed ? 'Complete' : 'Incomplete'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5" />
            <span>Achievements</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No achievements yet</p>
            <p className="text-sm">Complete actions to earn achievements!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
