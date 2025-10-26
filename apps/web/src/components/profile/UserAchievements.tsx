'use client';

import { useState, useEffect } from 'react';
import { ProfileService, UserAchievement } from '@/lib/services/profile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Target, Users, Calendar, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UserAchievementsProps {
  userId: string;
}

const achievementIcons = {
  first_poll: Target,
  poll_creator: Star,
  social_butterfly: Users,
  early_adopter: Calendar,
  trophy: Trophy,
};

const achievementColors = {
  first_poll: 'bg-blue-100 text-blue-800',
  poll_creator: 'bg-green-100 text-green-800',
  social_butterfly: 'bg-purple-100 text-purple-800',
  early_adopter: 'bg-orange-100 text-orange-800',
  trophy: 'bg-yellow-100 text-yellow-800',
};

export default function UserAchievements({ userId }: UserAchievementsProps) {
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAchievements = async () => {
      try {
        setIsLoading(true);
        const userAchievements =
          await ProfileService.getUserAchievements(userId);
        setAchievements(userAchievements);
      } catch (error) {
        console.error('Error loading achievements:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAchievements();
  }, [userId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5" />
            <span>Achievements</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2 text-muted-foreground">
              Loading achievements...
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
          <Trophy className="h-5 w-5" />
          <span>Achievements</span>
          <Badge variant="secondary">{achievements.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {achievements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No achievements yet</p>
            <p className="text-sm">
              Keep using the platform to unlock achievements!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map(achievement => {
              const IconComponent =
                achievementIcons[
                  achievement.achievement_type as keyof typeof achievementIcons
                ] || Trophy;
              const colorClass =
                achievementColors[
                  achievement.achievement_type as keyof typeof achievementColors
                ] || 'bg-gray-100 text-gray-800';

              return (
                <div
                  key={achievement.id}
                  className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className={`p-2 rounded-full ${colorClass}`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm capitalize">
                      {achievement.achievement_type.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Earned{' '}
                      {formatDistanceToNow(new Date(achievement.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                    {(achievement.achievement_data?.description as string) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {achievement.achievement_data?.description as string}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
