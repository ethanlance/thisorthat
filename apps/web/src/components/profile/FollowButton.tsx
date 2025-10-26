'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileService } from '@/lib/services/profile';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface FollowButtonProps {
  userId: string;
  displayName?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'sm' | 'default' | 'lg';
}

export default function FollowButton({
  userId,
  displayName,
  className,
  variant = 'default',
  size = 'default',
}: FollowButtonProps) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    if (!user || user.id === userId) {
      setIsLoading(false);
      return;
    }

    const checkFollowStatus = async () => {
      try {
        const following = await ProfileService.isFollowing(user.id, userId);
        setIsFollowing(following);
      } catch (error) {
        console.error('Error checking follow status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkFollowStatus();
  }, [user, userId]);

  // Don't show follow button for own profile
  if (!user || user.id === userId) {
    return null;
  }

  const handleToggleFollow = async () => {
    if (isToggling) return;

    setIsToggling(true);
    try {
      if (isFollowing) {
        await ProfileService.unfollowUser(userId);
        setIsFollowing(false);
        toast.success(`Unfollowed ${displayName || 'user'}`);
      } else {
        await ProfileService.followUser(userId);
        setIsFollowing(true);
        toast.success(`Following ${displayName || 'user'}`);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Failed to update follow status');
    } finally {
      setIsToggling(false);
    }
  };

  if (isLoading) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Loading...
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleToggleFollow}
      disabled={isToggling}
    >
      {isToggling ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : isFollowing ? (
        <UserMinus className="h-4 w-4 mr-2" />
      ) : (
        <UserPlus className="h-4 w-4 mr-2" />
      )}
      {isToggling ? 'Updating...' : isFollowing ? 'Unfollow' : 'Follow'}
    </Button>
  );
}
