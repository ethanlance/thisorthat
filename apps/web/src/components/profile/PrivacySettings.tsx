'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileService, UserProfileData } from '@/lib/services/profile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Shield, Users, Globe, Lock, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PrivacySettingsProps {
  onSave?: () => void;
}

export default function PrivacySettings({ onSave }: PrivacySettingsProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Privacy settings state
  const [privacyLevel, setPrivacyLevel] = useState<
    'public' | 'friends' | 'private'
  >('public');
  const [showEmail, setShowEmail] = useState(false);
  const [showActivity, setShowActivity] = useState(true);
  const [allowFollows, setAllowFollows] = useState(true);
  const [showAchievements, setShowAchievements] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const profileData = await ProfileService.getUserProfile(user.id);
        setProfile(profileData);

        // Set privacy settings from profile
        if (profileData) {
          setPrivacyLevel(profileData.privacy_level);
          // Use default values for privacy settings since they're not in the profile data
          setShowEmail(false);
          setShowActivity(true);
          setAllowFollows(true);
          setShowAchievements(true);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Failed to load privacy settings');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user || !profile) return;

    setIsSaving(true);
    try {
      await ProfileService.updateProfile({
        privacy_level: privacyLevel,
      });

      toast.success('Privacy settings updated successfully');
      onSave?.();
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      toast.error('Failed to update privacy settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Privacy Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2 text-muted-foreground">
              Loading privacy settings...
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
          <Shield className="h-5 w-5" />
          <span>Privacy Settings</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Visibility */}
        <div className="space-y-2">
          <Label className="text-base font-medium">Profile Visibility</Label>
          <div className="space-y-2">
            <Select
              value={privacyLevel}
              onValueChange={(value: 'public' | 'friends' | 'private') =>
                setPrivacyLevel(value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4" />
                    <span>Public - Anyone can see your profile</span>
                  </div>
                </SelectItem>
                <SelectItem value="friends">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>
                      Friends - Only people you follow can see your profile
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="private">
                  <div className="flex items-center space-x-2">
                    <Lock className="h-4 w-4" />
                    <span>Private - Only you can see your profile</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Information Sharing */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Information Sharing</Label>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="show-email">Show Email Address</Label>
                <p className="text-sm text-muted-foreground">
                  Allow others to see your email address
                </p>
              </div>
              <Switch
                id="show-email"
                checked={showEmail}
                onCheckedChange={setShowEmail}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="show-activity">Show Activity</Label>
                <p className="text-sm text-muted-foreground">
                  Display your recent activity on your profile
                </p>
              </div>
              <Switch
                id="show-activity"
                checked={showActivity}
                onCheckedChange={setShowActivity}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="show-achievements">Show Achievements</Label>
                <p className="text-sm text-muted-foreground">
                  Display your achievements and badges
                </p>
              </div>
              <Switch
                id="show-achievements"
                checked={showAchievements}
                onCheckedChange={setShowAchievements}
              />
            </div>
          </div>
        </div>

        {/* Social Settings */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Social Settings</Label>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="allow-follows">
                  Allow Others to Follow You
                </Label>
                <p className="text-sm text-muted-foreground">
                  Let other users follow you and see your updates
                </p>
              </div>
              <Switch
                id="allow-follows"
                checked={allowFollows}
                onCheckedChange={setAllowFollows}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
