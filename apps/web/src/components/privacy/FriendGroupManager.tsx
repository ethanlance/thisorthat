'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Users,
  Plus,
  Settings,
  UserPlus,
  UserMinus,
  Crown,
  Shield,
  Globe,
  Lock,
  MoreHorizontal,
  Trash2,
  Edit,
  Loader2,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

interface FriendGroup {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  member_count: number;
  created_at: string;
  created_by: string;
}

interface GroupMember {
  user_id: string;
  display_name: string;
  email: string;
  role: 'admin' | 'member';
  joined_at: string;
}

interface FriendGroupManagerProps {
  className?: string;
}

export default function FriendGroupManager({ className }: FriendGroupManagerProps) {
  const [groups, setGroups] = useState<FriendGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<FriendGroup | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isManagingMembers, setIsManagingMembers] = useState(false);

  // Form states
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');

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
      setGroups(data.groups || []);
    } catch (err) {
      console.error('Error loading friend groups:', err);
      setError('Failed to load friend groups');
    } finally {
      setLoading(false);
    }
  };

  const loadGroupMembers = async (groupId: string) => {
    try {
      const response = await fetch(`/api/friend-groups/${groupId}/members`);
      if (!response.ok) {
        throw new Error('Failed to load group members');
      }

      const data = await response.json();
      setMembers(data.members || []);
    } catch (err) {
      console.error('Error loading group members:', err);
      setError('Failed to load group members');
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    try {
      setError(null);

      const response = await fetch('/api/friend-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: groupName.trim(),
          description: groupDescription.trim() || null,
          is_public: isPublic,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create group');
      }

      const newGroup = await response.json();
      setGroups([...groups, newGroup.group]);
      setIsCreatingGroup(false);
      setGroupName('');
      setGroupDescription('');
      setIsPublic(false);
    } catch (err) {
      console.error('Error creating group:', err);
      setError(err instanceof Error ? err.message : 'Failed to create group');
    }
  };

  const handleInviteUser = async (groupId: string) => {
    if (!inviteEmail.trim()) {
      setError('Email is required');
      return;
    }

    try {
      setError(null);

      const response = await fetch(`/api/friend-groups/${groupId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          message: inviteMessage.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send invitation');
      }

      setInviteEmail('');
      setInviteMessage('');
      // Refresh members list
      await loadGroupMembers(groupId);
    } catch (err) {
      console.error('Error inviting user:', err);
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    }
  };

  const handleRemoveMember = async (groupId: string, userId: string) => {
    try {
      setError(null);

      const response = await fetch(`/api/friend-groups/${groupId}/members/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove member');
      }

      // Refresh members list
      await loadGroupMembers(groupId);
    } catch (err) {
      console.error('Error removing member:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      // Implementation for deleting group
      console.log('Delete group:', groupId);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading friend groups...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Users className="h-6 w-6" />
            <span>Friend Groups</span>
          </h2>
          <p className="text-muted-foreground">
            Create and manage groups of friends to share private polls
          </p>
        </div>
        <Dialog open={isCreatingGroup} onOpenChange={setIsCreatingGroup}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Friend Group</DialogTitle>
              <DialogDescription>
                Create a new group to share polls with specific friends
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="group-name">Group Name *</Label>
                <Input
                  id="group-name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g., College Friends, Work Team"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="group-description">Description</Label>
                <Textarea
                  id="group-description"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Describe your group..."
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-public"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
                <Label htmlFor="is-public">Make group discoverable</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreatingGroup(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Group</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Groups List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map(group => (
          <Card key={group.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                </div>
                <div className="flex items-center space-x-1">
                  {group.is_public ? (
                    <Globe className="h-4 w-4 text-green-500" title="Public" />
                  ) : (
                    <Lock className="h-4 w-4 text-orange-500" title="Private" />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedGroup(group);
                      setIsManagingMembers(true);
                      loadGroupMembers(group.id);
                    }}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {group.description && (
                <p className="text-sm text-muted-foreground">{group.description}</p>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    {group.member_count} member{group.member_count !== 1 ? 's' : ''}
                  </Badge>
                  <Badge variant={group.is_public ? 'default' : 'secondary'}>
                    {group.is_public ? 'Public' : 'Private'}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Created {new Date(group.created_at).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {groups.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Friend Groups Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first friend group to start sharing private polls with specific friends.
            </p>
            <Button onClick={() => setIsCreatingGroup(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Group
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Group Management Dialog */}
      <Dialog open={isManagingMembers} onOpenChange={setIsManagingMembers}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Manage {selectedGroup?.name}</span>
            </DialogTitle>
            <DialogDescription>
              Add or remove members from this friend group
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Invite New Member */}
            <div className="space-y-4">
              <h4 className="font-medium">Invite New Member</h4>
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <Button
                  onClick={() => selectedGroup && handleInviteUser(selectedGroup.id)}
                  disabled={!inviteEmail.trim()}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite
                </Button>
              </div>
              <Textarea
                placeholder="Optional message for the invitation..."
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                rows={2}
              />
            </div>

            {/* Members List */}
            <div className="space-y-4">
              <h4 className="font-medium">Group Members ({members.length})</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {members.map(member => (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        {member.role === 'admin' ? (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <Users className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{member.display_name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                        {member.role}
                      </Badge>
                      {member.role !== 'admin' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => selectedGroup && handleRemoveMember(selectedGroup.id, member.user_id)}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between">
              <Button
                variant="destructive"
                onClick={() => selectedGroup && handleDeleteGroup(selectedGroup.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Group
              </Button>
              <Button onClick={() => setIsManagingMembers(false)}>
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}