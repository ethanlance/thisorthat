'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  Users,
  Globe,
  Lock,
  UserPlus,
  Clock,
  Info,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

interface FriendGroup {
  id: string;
  name: string;
  description: string | null;
  member_count: number;
  is_public: boolean;
}

interface PollPrivacySettingsProps {
  onPrivacyChange: (settings: PollPrivacySettings) => void;
  initialSettings?: PollPrivacySettings;
  disabled?: boolean;
  className?: string;
}

export interface PollPrivacySettings {
  privacy_level: 'public' | 'private' | 'group';
  friend_group_id?: string;
  access_expires_at?: string;
  invited_users?: string[];
  custom_message?: string;
}

export interface PollSettings {
  privacy_level: 'public' | 'private' | 'group';
  friend_group_id?: string;
  access_expires_at?: string;
  invited_users?: string[];
  custom_message?: string;
}

export default function PollPrivacySettings({
  onPrivacyChange,
  initialSettings,
  disabled = false,
  className,
}: PollPrivacySettingsProps) {
  const [privacyLevel, setPrivacyLevel] = useState<'public' | 'private' | 'group'>('public');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [friendGroups, setFriendGroups] = useState<FriendGroup[]>([]);
  const [invitedUsers, setInvitedUsers] = useState<string[]>([]);
  const [userInput, setUserInput] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [accessExpires, setAccessExpires] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialSettings) {
      setPrivacyLevel(initialSettings.privacy_level);
      setSelectedGroup(initialSettings.friend_group_id || '');
      setInvitedUsers(initialSettings.invited_users || []);
      setCustomMessage(initialSettings.custom_message || '');
      setAccessExpires(initialSettings.access_expires_at || '');
    }
  }, [initialSettings]);

  useEffect(() => {
    loadFriendGroups();
  }, []);

  useEffect(() => {
    // Notify parent component of changes
    const settings: PollPrivacySettings = {
      privacy_level: privacyLevel,
      friend_group_id: selectedGroup || undefined,
      access_expires_at: accessExpires || undefined,
      invited_users: invitedUsers,
      custom_message: customMessage || undefined,
    };
    onPrivacyChange(settings);
  }, [privacyLevel, selectedGroup, invitedUsers, customMessage, accessExpires, onPrivacyChange]);

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
      setError('Failed to load friend groups');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    if (userInput.trim() && !invitedUsers.includes(userInput.trim())) {
      setInvitedUsers([...invitedUsers, userInput.trim()]);
      setUserInput('');
    }
  };

  const handleRemoveUser = (userToRemove: string) => {
    setInvitedUsers(invitedUsers.filter(user => user !== userToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddUser();
    }
  };

  const getPrivacyIcon = (level: string) => {
    switch (level) {
      case 'public':
        return <Globe className="h-4 w-4" />;
      case 'private':
        return <Lock className="h-4 w-4" />;
      case 'group':
        return <Users className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getPrivacyDescription = (level: string) => {
    switch (level) {
      case 'public':
        return 'Anyone with the link can view and vote';
      case 'private':
        return 'Only invited users can view and vote';
      case 'group':
        return 'All members of the selected group can view and vote';
      default:
        return '';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Privacy Settings</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Privacy Level Selection */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Who can access this poll?</Label>
          <RadioGroup
            value={privacyLevel}
            onValueChange={(value) => setPrivacyLevel(value as 'public' | 'private' | 'group')}
            disabled={disabled}
          >
            <div className="flex items-start space-x-3 p-3 border rounded-lg">
              <RadioGroupItem value="public" id="public" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="public" className="flex items-center space-x-2 cursor-pointer">
                  {getPrivacyIcon('public')}
                  <span className="font-medium">Public</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {getPrivacyDescription('public')}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 border rounded-lg">
              <RadioGroupItem value="private" id="private" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="private" className="flex items-center space-x-2 cursor-pointer">
                  {getPrivacyIcon('private')}
                  <span className="font-medium">Private</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {getPrivacyDescription('private')}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 border rounded-lg">
              <RadioGroupItem value="group" id="group" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="group" className="flex items-center space-x-2 cursor-pointer">
                  {getPrivacyIcon('group')}
                  <span className="font-medium">Friend Group</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {getPrivacyDescription('group')}
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Friend Group Selection */}
        {privacyLevel === 'group' && (
          <div className="space-y-3">
            <Label htmlFor="friend-group">Select Friend Group</Label>
            <Select
              value={selectedGroup}
              onValueChange={setSelectedGroup}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a friend group" />
              </SelectTrigger>
              <SelectContent>
                {friendGroups.map(group => (
                  <SelectItem key={group.id} value={group.id}>
                    <div className="flex items-center space-x-2">
                      <span>{group.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {group.member_count} members
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {friendGroups.length === 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  You don't have any friend groups yet. Create one to share polls with specific groups of friends.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Private Poll Invitations */}
        {privacyLevel === 'private' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-users">Invite Users</Label>
              <div className="flex space-x-2">
                <Input
                  id="invite-users"
                  placeholder="Enter email or username"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={disabled}
                />
                <Button
                  type="button"
                  onClick={handleAddUser}
                  disabled={!userInput.trim() || disabled}
                  size="sm"
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Invited Users List */}
            {invitedUsers.length > 0 && (
              <div className="space-y-2">
                <Label>Invited Users ({invitedUsers.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {invitedUsers.map((user, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center space-x-1"
                    >
                      <span>{user}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveUser(user)}
                        disabled={disabled}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Message */}
            <div className="space-y-2">
              <Label htmlFor="custom-message">Custom Message (Optional)</Label>
              <Textarea
                id="custom-message"
                placeholder="Add a personal message to your invitations..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                disabled={disabled}
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {customMessage.length}/500 characters
              </p>
            </div>
          </div>
        )}

        {/* Access Expiration */}
        <div className="space-y-2">
          <Label htmlFor="access-expires">Access Expires (Optional)</Label>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Input
              id="access-expires"
              type="datetime-local"
              value={accessExpires}
              onChange={(e) => setAccessExpires(e.target.value)}
              disabled={disabled}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Leave empty for permanent access
          </p>
        </div>

        {/* Privacy Preview */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">Privacy Preview</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {privacyLevel === 'public' && (
              <p>This poll will be visible to everyone and can be shared publicly.</p>
            )}
            {privacyLevel === 'private' && (
              <p>
                This poll will only be accessible to you and {invitedUsers.length} invited user{invitedUsers.length !== 1 ? 's' : ''}.
              </p>
            )}
            {privacyLevel === 'group' && selectedGroup && (
              <p>
                This poll will be accessible to all members of the selected friend group.
              </p>
            )}
            {privacyLevel === 'group' && !selectedGroup && (
              <p>Please select a friend group to continue.</p>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}