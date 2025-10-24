'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileData, ProfileService } from '@/lib/services/profile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import AvatarUpload from './AvatarUpload';

interface ProfileEditorProps {
  onSave?: () => void;
}

export default function ProfileEditor({ onSave }: ProfileEditorProps) {
  const { user } = useAuth();
  const [, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState('');
  const [privacyLevel, setPrivacyLevel] = useState<
    'public' | 'friends' | 'private'
  >('public');

  useEffect(() => {
    if (user?.id) {
      loadProfile();
    }
  }, [user?.id]);

  const loadProfile = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const profileData = await ProfileService.getUserProfile(user.id);
      if (profileData) {
        setProfile(profileData);
        setDisplayName(profileData.display_name || '');
        setBio(profileData.bio || '');
        setAvatarUrl(profileData.avatar_url || '');
        setInterests(profileData.interests || []);
        setPrivacyLevel(profileData.privacy_level);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    try {
      setIsSaving(true);

      const success = await ProfileService.updateProfile(user.id, {
        display_name: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
        avatar_url: avatarUrl.trim() || undefined,
        interests: interests.length > 0 ? interests : undefined,
        privacy_level: privacyLevel,
      });

      if (success) {
        toast.success('Profile updated successfully');
        await loadProfile();
        onSave?.();
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const addInterest = () => {
    const interest = newInterest.trim();
    if (interest && !interests.includes(interest)) {
      setInterests([...interests, interest]);
      setNewInterest('');
    }
  };

  const removeInterest = (interestToRemove: string) => {
    setInterests(interests.filter(interest => interest !== interestToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addInterest();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        <div className="space-y-4">
          <div className="h-10 w-full bg-muted rounded animate-pulse" />
          <div className="h-20 w-full bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="space-y-2">
            <Label>Profile Picture</Label>
            <AvatarUpload
              currentAvatarUrl={avatarUrl}
              onAvatarChange={newUrl => setAvatarUrl(newUrl || '')}
              disabled={isSaving}
            />
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="display-name">Display Name</Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              maxLength={50}
            />
            <p className="text-sm text-muted-foreground">
              {displayName.length}/50 characters
            </p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              maxLength={500}
              rows={4}
            />
            <p className="text-sm text-muted-foreground">
              {bio.length}/500 characters
            </p>
          </div>

          {/* Interests */}
          <div className="space-y-2">
            <Label>Interests</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {interests.map((interest, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {interest}
                  <button
                    onClick={() => removeInterest(interest)}
                    className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex space-x-2">
              <Input
                value={newInterest}
                onChange={e => setNewInterest(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add an interest..."
                maxLength={30}
              />
              <Button onClick={addInterest} variant="outline" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Privacy Level */}
          <div className="space-y-2">
            <Label htmlFor="privacy-level">Privacy Level</Label>
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
                  Public - Anyone can see your profile
                </SelectItem>
                <SelectItem value="friends">
                  Friends - Only people you follow can see your profile
                </SelectItem>
                <SelectItem value="private">
                  Private - Only you can see your profile
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Save Button */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
