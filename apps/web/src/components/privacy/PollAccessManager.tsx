'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Shield,
  Users,
  UserPlus,
  UserMinus,
  Mail,
  Clock,
  Eye,
  Vote,
  Crown,
  MoreHorizontal,
  Loader2,
  AlertTriangle,
  CheckCircle,
  X,
} from 'lucide-react';

interface PollAccess {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  access_level: 'view' | 'view_vote' | 'admin';
  shared_at: string;
  expires_at: string | null;
  is_active: boolean;
}

interface PollInvitation {
  id: string;
  invited_user_id: string;
  email: string;
  message: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
  responded_at: string | null;
}

interface PollAccessManagerProps {
  pollId: string;
  pollTitle: string;
  privacyLevel: 'public' | 'private' | 'group';
  className?: string;
}

export default function PollAccessManager({
  pollId,
  pollTitle,
  privacyLevel,
  className,
}: PollAccessManagerProps) {
  const [accessList, setAccessList] = useState<PollAccess[]>([]);
  const [invitations, setInvitations] = useState<PollInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);

  // Invitation form states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [accessLevel, setAccessLevel] = useState<'view' | 'view_vote' | 'admin'>('view_vote');
  const [expiresAt, setExpiresAt] = useState('');

  useEffect(() => {
    loadPollAccess();
  }, [pollId]);

  const loadPollAccess = async () => {
    try {
      setLoading(true);
      setError(null);

      const [accessResponse, invitationsResponse] = await Promise.all([
        fetch(`/api/polls/${pollId}/access`),
        fetch(`/api/polls/${pollId}/invitations`),
      ]);

      if (!accessResponse.ok) {
        throw new Error('Failed to load poll access');
      }

      if (!invitationsResponse.ok) {
        throw new Error('Failed to load poll invitations');
      }

      const [accessData, invitationsData] = await Promise.all([
        accessResponse.json(),
        invitationsResponse.json(),
      ]);

      setAccessList(accessData.access || []);
      setInvitations(invitationsData.invitations || []);
    } catch (err) {
      console.error('Error loading poll access:', err);
      setError('Failed to load poll access information');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteEmail.trim()) {
      setError('Email is required');
      return;
    }

    try {
      setError(null);

      const response = await fetch(`/api/polls/${pollId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          message: inviteMessage.trim() || null,
          access_level: accessLevel,
          expires_at: expiresAt || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send invitation');
      }

      setInviteEmail('');
      setInviteMessage('');
      setExpiresAt('');
      setIsInviting(false);
      await loadPollAccess();
    } catch (err) {
      console.error('Error inviting user:', err);
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    }
  };

  const handleRevokeAccess = async (accessId: string) => {
    if (confirm('Are you sure you want to revoke this user\'s access?')) {
      try {
        setError(null);

        const response = await fetch(`/api/polls/${pollId}/access/${accessId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to revoke access');
        }

        await loadPollAccess();
      } catch (err) {
        console.error('Error revoking access:', err);
        setError(err instanceof Error ? err.message : 'Failed to revoke access');
      }
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (confirm('Are you sure you want to cancel this invitation?')) {
      try {
        setError(null);

        const response = await fetch(`/api/polls/${pollId}/invitations/${invitationId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to cancel invitation');
        }

        await loadPollAccess();
      } catch (err) {
        console.error('Error canceling invitation:', err);
        setError(err instanceof Error ? err.message : 'Failed to cancel invitation');
      }
    }
  };

  const getAccessLevelIcon = (level: string) => {
    switch (level) {
      case 'view':
        return <Eye className="h-4 w-4" />;
      case 'view_vote':
        return <Vote className="h-4 w-4" />;
      case 'admin':
        return <Crown className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'view':
        return 'bg-blue-100 text-blue-800';
      case 'view_vote':
        return 'bg-green-100 text-green-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading poll access...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Poll Access Management</span>
          </h2>
          <p className="text-sm text-muted-foreground">{pollTitle}</p>
        </div>
        {privacyLevel === 'private' && (
          <Dialog open={isInviting} onOpenChange={setIsInviting}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite User to Poll</DialogTitle>
                <DialogDescription>
                  Send an invitation to access this private poll
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInviteUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email Address *</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="access-level">Access Level</Label>
                  <Select value={accessLevel} onValueChange={(value) => setAccessLevel(value as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view">
                        <div className="flex items-center space-x-2">
                          <Eye className="h-4 w-4" />
                          <span>View Only</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="view_vote">
                        <div className="flex items-center space-x-2">
                          <Vote className="h-4 w-4" />
                          <span>View & Vote</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center space-x-2">
                          <Crown className="h-4 w-4" />
                          <span>Admin</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expires-at">Expires At (Optional)</Label>
                  <Input
                    id="expires-at"
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-message">Message (Optional)</Label>
                  <Textarea
                    id="invite-message"
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    placeholder="Add a personal message..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsInviting(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Send Invitation</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Privacy Level Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="font-medium">Privacy Level:</span>
            <Badge variant={privacyLevel === 'public' ? 'default' : 'secondary'}>
              {privacyLevel.charAt(0).toUpperCase() + privacyLevel.slice(1)}
            </Badge>
          </div>
          {privacyLevel === 'public' && (
            <p className="text-sm text-muted-foreground mt-2">
              This poll is public and accessible to everyone with the link.
            </p>
          )}
          {privacyLevel === 'private' && (
            <p className="text-sm text-muted-foreground mt-2">
              This poll is private and only accessible to invited users.
            </p>
          )}
          {privacyLevel === 'group' && (
            <p className="text-sm text-muted-foreground mt-2">
              This poll is accessible to all members of the associated friend group.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Current Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Current Access ({accessList.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {accessList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No users have access to this poll yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {accessList.map(access => (
                <div
                  key={access.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      {getAccessLevelIcon(access.access_level)}
                    </div>
                    <div>
                      <p className="font-medium">{access.display_name}</p>
                      <p className="text-sm text-muted-foreground">{access.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Added {new Date(access.shared_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getAccessLevelColor(access.access_level)}>
                      {access.access_level.replace('_', ' ')}
                    </Badge>
                    {access.expires_at && (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        Expires {new Date(access.expires_at).toLocaleDateString()}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeAccess(access.id)}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Pending Invitations ({invitations.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations.map(invitation => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Mail className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium">{invitation.email}</p>
                      {invitation.message && (
                        <p className="text-sm text-muted-foreground">{invitation.message}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Sent {new Date(invitation.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(invitation.status)}>
                      {invitation.status}
                    </Badge>
                    {invitation.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelInvitation(invitation.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
