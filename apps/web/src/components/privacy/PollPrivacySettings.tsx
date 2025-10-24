'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Globe,
  Lock,
  Users,
  Calendar,
  Shield,
  AlertTriangle,
  Info,
} from 'lucide-react';
import {
  FriendGroupService,
  FriendGroupWithMembers,
} from '@/lib/services/friend-groups';

interface PollPrivacySettingsProps {
  privacyLevel: 'public' | 'private' | 'group';
  friendGroupId: string | null;
  accessExpiresAt: string | null;
  onPrivacyChange: (privacy: {
    privacy_level: 'public' | 'private' | 'group';
    friend_group_id: string | null;
    access_expires_at: string | null;
  }) => void;
  className?: string;
}

export default function PollPrivacySettings({
  privacyLevel,
  friendGroupId,
  accessExpiresAt,
  onPrivacyChange,
  className,
}: PollPrivacySettingsProps) {
  const [friendGroups, setFriendGroups] = useState<FriendGroupWithMembers[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasExpiration, setHasExpiration] = useState(!!accessExpiresAt);
  const [expirationDate, setExpirationDate] = useState(
    accessExpiresAt ? new Date(accessExpiresAt).toISOString().slice(0, 16) : ''
  );

  useEffect(() => {
    loadFriendGroups();
  }, []);

  const loadFriendGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/friend-groups');

      if (!response.ok) {
        throw new Error('Failed to load friend groups');
      }

      const data = await response.json();
      setFriendGroups(data.groups || []);
    } catch (err) {
      console.error('Error loading friend groups:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load friend groups'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacyLevelChange = (level: 'public' | 'private' | 'group') => {
    const updates = {
      privacy_level: level,
      friend_group_id: level === 'group' ? friendGroupId : null,
      access_expires_at: hasExpiration ? accessExpiresAt : null,
    };
    onPrivacyChange(updates);
  };

  const handleFriendGroupChange = (groupId: string) => {
    const updates = {
      privacy_level: 'group' as const,
      friend_group_id: groupId,
      access_expires_at: hasExpiration ? accessExpiresAt : null,
    };
    onPrivacyChange(updates);
  };

  const handleExpirationToggle = (enabled: boolean) => {
    setHasExpiration(enabled);
    const updates = {
      privacy_level: privacyLevel,
      friend_group_id: friendGroupId,
      access_expires_at: enabled
        ? accessExpiresAt ||
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        : null,
    };
    onPrivacyChange(updates);
  };

  const handleExpirationDateChange = (date: string) => {
    setExpirationDate(date);
    const updates = {
      privacy_level: privacyLevel,
      friend_group_id: friendGroupId,
      access_expires_at: date ? new Date(date).toISOString() : null,
    };
    onPrivacyChange(updates);
  };

  const getPrivacyIcon = (level: string) => {
    switch (level) {
      case 'public':
        return <Globe className="h-4 w-4 text-green-500" />;
      case 'private':
        return <Lock className="h-4 w-4 text-orange-500" />;
      case 'group':
        return <Users className="h-4 w-4 text-blue-500" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getPrivacyDescription = (level: string) => {
    switch (level) {
      case 'public':
        return 'Anyone with the link can view and vote on this poll';
      case 'private':
        return 'Only invited users can view and vote on this poll';
      case 'group':
        return 'Only members of the selected friend group can view and vote';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2">Loading privacy settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Poll Privacy Settings</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Privacy Level Selection */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Privacy Level</Label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Public */}
            <div
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                privacyLevel === 'public'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted/50'
              }`}
              onClick={() => handlePrivacyLevelChange('public')}
            >
              <div className="flex items-center space-x-3 mb-2">
                {getPrivacyIcon('public')}
                <span className="font-medium">Public</span>
                {privacyLevel === 'public' && (
                  <Badge variant="default" className="ml-auto">
                    Selected
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {getPrivacyDescription('public')}
              </p>
            </div>

            {/* Private */}
            <div
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                privacyLevel === 'private'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted/50'
              }`}
              onClick={() => handlePrivacyLevelChange('private')}
            >
              <div className="flex items-center space-x-3 mb-2">
                {getPrivacyIcon('private')}
                <span className="font-medium">Private</span>
                {privacyLevel === 'private' && (
                  <Badge variant="default" className="ml-auto">
                    Selected
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {getPrivacyDescription('private')}
              </p>
            </div>

            {/* Group */}
            <div
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                privacyLevel === 'group'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted/50'
              }`}
              onClick={() => handlePrivacyLevelChange('group')}
            >
              <div className="flex items-center space-x-3 mb-2">
                {getPrivacyIcon('group')}
                <span className="font-medium">Friend Group</span>
                {privacyLevel === 'group' && (
                  <Badge variant="default" className="ml-auto">
                    Selected
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {getPrivacyDescription('group')}
              </p>
            </div>
          </div>
        </div>

        {/* Friend Group Selection */}
        {privacyLevel === 'group' && (
          <div className="space-y-2">
            <Label htmlFor="friend-group">Select Friend Group</Label>
            <Select
              value={friendGroupId || ''}
              onValueChange={handleFriendGroupChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a friend group" />
              </SelectTrigger>
              <SelectContent>
                {friendGroups.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2" />
                    <p>No friend groups available</p>
                    <p className="text-sm">Create a friend group first</p>
                  </div>
                ) : (
                  friendGroups.map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      <div className="flex items-center space-x-2">
                        <span>{group.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {group.member_count} members
                        </Badge>
                        {group.is_public && (
                          <Badge variant="secondary" className="text-xs">
                            Public
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {friendGroups.length === 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  You need to create a friend group first. Go to your profile to
                  create one.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Access Expiration */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="access-expiration"
              checked={hasExpiration}
              onCheckedChange={handleExpirationToggle}
            />
            <Label
              htmlFor="access-expiration"
              className="flex items-center space-x-2"
            >
              <Calendar className="h-4 w-4" />
              <span>Set access expiration</span>
            </Label>
          </div>

          {hasExpiration && (
            <div className="space-y-2">
              <Label htmlFor="expiration-date">Expiration Date</Label>
              <Input
                id="expiration-date"
                type="datetime-local"
                value={expirationDate}
                onChange={e => handleExpirationDateChange(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
              <p className="text-xs text-muted-foreground">
                Access to this poll will expire at the specified date and time.
              </p>
            </div>
          )}
        </div>

        {/* Privacy Summary */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Current settings:</strong>{' '}
            {getPrivacyDescription(privacyLevel)}
            {privacyLevel === 'group' && friendGroupId && (
              <span className="block mt-1">
                Selected group:{' '}
                {friendGroups.find(g => g.id === friendGroupId)?.name}
              </span>
            )}
            {hasExpiration && accessExpiresAt && (
              <span className="block mt-1">
                Expires: {new Date(accessExpiresAt).toLocaleString()}
              </span>
            )}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
