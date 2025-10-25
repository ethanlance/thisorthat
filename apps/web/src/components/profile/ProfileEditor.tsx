'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Mail,
  Camera,
  Save,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Globe,
  Users,
  Lock,
  Star,
  X,
} from 'lucide-react';
import {
  ProfileService,
  UserProfileData,
  ProfileUpdateData,
} from '@/lib/services/profile';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileEditorProps {
  onSave?: (profile: UserProfileData) => void;
  onCancel?: () => void;
  className?: string;
}

export default function ProfileEditor({
  onSave,
  onCancel,
  className,
}: ProfileEditorProps) {
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<ProfileUpdateData>({});
  const [newInterest, setNewInterest] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const profileData = await ProfileService.getCurrentUserProfile();

      if (!profileData) {
        setProfile(profileData);
        setFormData({
          display_name: profileData.display_name || '',
          bio: profileData.bio || '',
          avatar_url: profileData.avatar_url || '',
          interests: profileData.interests || [],
          privacy_level: profileData.privacy_level,
        });
        setAvatarPreview(profileData.avatar_url || null);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProfileUpdateData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleInterestAdd = () => {
    if (!newInterest.trim()) return;

    const interest = newInterest.trim();
    if (formData.interests?.includes(interest)) return;

    setFormData(prev => ({
      ...prev,
      interests: [...(prev.interests || []), interest],
    }));
    setNewInterest('');
  };

  const handleInterestRemove = (interestToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      interests:
        prev.interests?.filter(interest => interest !== interestToRemove) || [],
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const preview = URL.createObjectURL(file);
      setAvatarPreview(preview);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Upload avatar if changed
      let avatarUrl = formData.avatar_url;
      if (avatarFile) {
        const uploadedUrl = await ProfileService.uploadAvatar(avatarFile);
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        }
      }

      // Update profile
      const updateData: ProfileUpdateData = {
        ...formData,
        avatar_url: avatarUrl,
      };

      const success = await ProfileService.updateProfile(updateData);

      if (success) {
        setSuccess('Profile updated successfully!');
        // Reload profile to get updated data
        await loadProfile();
        if (onSave) {
          const updatedProfile = await ProfileService.getCurrentUserProfile();
          if (updatedProfile) {
            onSave(updatedProfile);
          }
        }
      } else {
        setError('Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
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

  if (!profile) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Profile not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Edit Profile</h1>
          <p className="text-muted-foreground">
            Customize your profile information and preferences
          </p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Camera className="h-5 w-5" />
              <span>Profile Picture</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarPreview || undefined} />
                <AvatarFallback className="text-xl">
                  {formData.display_name
                    ? getInitials(formData.display_name)
                    : 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <Label htmlFor="avatar" className="cursor-pointer">
                  <Button type="button" variant="outline" asChild>
                    <span>
                      <Camera className="h-4 w-4 mr-2" />
                      Change Avatar
                    </span>
                  </Button>
                </Label>
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Upload a profile picture (JPG, PNG, max 5MB)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Basic Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name *</Label>
                <Input
                  id="display_name"
                  value={formData.display_name || ''}
                  onChange={e =>
                    handleInputChange('display_name', e.target.value)
                  }
                  placeholder="Enter your display name"
                  maxLength={50}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {(formData.display_name || '').length}/50 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="privacy_level">Privacy Level</Label>
                <Select
                  value={formData.privacy_level || 'public'}
                  onValueChange={value =>
                    handleInputChange('privacy_level', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4" />
                        <span>Public</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="friends">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>Friends Only</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="private">
                      <div className="flex items-center space-x-2">
                        <Lock className="h-4 w-4" />
                        <span>Private</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio || ''}
                onChange={e => handleInputChange('bio', e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {(formData.bio || '').length}/500 characters
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Interests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5" />
              <span>Interests</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                value={newInterest}
                onChange={e => setNewInterest(e.target.value)}
                placeholder="Add an interest..."
                onKeyPress={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleInterestAdd();
                  }
                }}
              />
              <Button
                type="button"
                onClick={handleInterestAdd}
                disabled={!newInterest.trim()}
              >
                Add
              </Button>
            </div>

            {formData.interests && formData.interests.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.interests.map((interest, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center space-x-1"
                  >
                    <span>{interest}</span>
                    <button
                      type="button"
                      onClick={() => handleInterestRemove(interest)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Account Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile.email} disabled />
              <p className="text-xs text-muted-foreground">
                Contact support to change your email address
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
