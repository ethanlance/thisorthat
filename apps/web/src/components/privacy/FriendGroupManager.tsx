'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Users,
  Plus,
  Settings,
  Trash2,
  UserPlus,
  UserMinus,
  Crown,
  Shield,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import {
  FriendGroupService,
  FriendGroupWithMembers,
} from '@/lib/services/friend-groups';
import { toast } from 'sonner';

interface FriendGroupManagerProps {
  className?: string;
}

export default function FriendGroupManager({
  className,
}: FriendGroupManagerProps) {
  const [groups, setGroups] = useState<FriendGroupWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showMembersDialog, setShowMembersDialog] = useState<string | null>(
    null
  );
  const [isCreating, setIsCreating] = useState(false);

  // Create group form state
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
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
      setError(
        err instanceof Error ? err.message : 'Failed to load friend groups'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!groupName.trim()) {
      toast.error('Group name is required');
      return;
    }

    setIsCreating(true);
    try {
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

      const data = await response.json();
      setGroups(prev => [data.group, ...prev]);
      setGroupName('');
      setGroupDescription('');
      setIsPublic(false);
      setShowCreateDialog(false);
      toast.success('Friend group created successfully');
    } catch (err) {
      console.error('Error creating group:', err);
      toast.error(
        err instanceof Error ? err.message : 'Failed to create group'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this group? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/friend-groups/${groupId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete group');
      }

      setGroups(prev => prev.filter(group => group.id !== groupId));
      toast.success('Group deleted successfully');
    } catch (err) {
      console.error('Error deleting group:', err);
      toast.error(
        err instanceof Error ? err.message : 'Failed to delete group'
      );
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading friend groups...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
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
            Create and manage friend groups for private polls
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
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
                Create a new friend group to organize your private polls.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="group-name">Group Name *</Label>
                <Input
                  id="group-name"
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  placeholder="Enter group name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="group-description">Description</Label>
                <Textarea
                  id="group-description"
                  value={groupDescription}
                  onChange={e => setGroupDescription(e.target.value)}
                  placeholder="Enter group description (optional)"
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-public"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
                <Label htmlFor="is-public">
                  Public group (discoverable by others)
                </Label>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Group'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Groups List */}
      {groups.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Friend Groups</h3>
            <p className="text-muted-foreground mb-4">
              Create your first friend group to start organizing private polls.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Group
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map(group => (
            <Card key={group.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <span>{group.name}</span>
                      {group.is_public && (
                        <Badge variant="outline">Public</Badge>
                      )}
                    </CardTitle>
                    {group.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {group.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowMembersDialog(group.id)}
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteGroup(group.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{group.member_count} members</span>
                  </span>
                  <span>
                    Created {new Date(group.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Members Dialog */}
      {showMembersDialog && (
        <Dialog
          open={!!showMembersDialog}
          onOpenChange={() => setShowMembersDialog(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Group Members</DialogTitle>
              <DialogDescription>
                Manage members and their roles in this group.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Members list would go here */}
              <p className="text-muted-foreground">
                Members management coming soon...
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
