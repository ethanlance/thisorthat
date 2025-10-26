'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Lock,
  Shield,
  Vote,
  Loader2,
  AlertTriangle,
  CheckCircle,
  UserPlus,
} from 'lucide-react';
import { PollPrivacyService } from '@/lib/services/poll-privacy';
import { FriendGroupService } from '@/lib/services/friend-groups';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/types/database';

type Poll = Database['public']['Tables']['polls']['Row'];
// Removed unused PrivatePoll interface

interface GroupInvitation {
  id: string;
  group_name: string;
  inviter_name: string;
  message: string | null;
  created_at: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}

interface PollInvitation {
  id: string;
  poll_title: string;
  inviter_name: string;
  message: string | null;
  created_at: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}

interface PrivatePollFeedProps {
  className?: string;
}

export default function PrivatePollFeed({ className }: PrivatePollFeedProps) {
  const { user } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [groupInvitations, setGroupInvitations] = useState<GroupInvitation[]>(
    []
  );
  const [pollInvitations, setPollInvitations] = useState<PollInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('polls');

  const loadPrivatePolls = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const accessiblePolls = await PollPrivacyService.getUserAccessiblePolls(
        user.id
      );
      setPolls(accessiblePolls);
    } catch (err) {
      console.error('Error loading private polls:', err);
      setError('Failed to load private polls');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadPrivatePolls();
    loadInvitations();
  }, [loadPrivatePolls]);

  const loadInvitations = async () => {
    try {
      const [groupInvites, pollInvites] = await Promise.all([
        FriendGroupService.getUserGroupInvitations(),
        PollPrivacyService.getUserPollInvitations(),
      ]);

      setGroupInvitations(groupInvites);
      setPollInvitations(pollInvites);
    } catch (err) {
      console.error('Error loading invitations:', err);
    }
  };

  const handleRespondToGroupInvitation = async (
    invitationId: string,
    response: 'accepted' | 'declined'
  ) => {
    try {
      const success = await FriendGroupService.respondToGroupInvitation(
        invitationId,
        response
      );

      if (success) {
        await loadInvitations();
        await loadPrivatePolls(); // Refresh polls in case new group access was granted
      }
    } catch (err) {
      console.error('Error responding to group invitation:', err);
      setError('Failed to respond to invitation');
    }
  };

  const handleRespondToPollInvitation = async (
    invitationId: string,
    response: 'accepted' | 'declined'
  ) => {
    try {
      const success = await PollPrivacyService.respondToPollInvitation(
        invitationId,
        response
      );

      if (success) {
        await loadInvitations();
        await loadPrivatePolls(); // Refresh polls to show newly accessible poll
      }
    } catch (err) {
      console.error('Error responding to poll invitation:', err);
      setError('Failed to respond to invitation');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'closed':
        return <Lock className="h-4 w-4 text-gray-500" />;
      case 'deleted':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'deleted':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading private polls...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Shield className="h-6 w-6" />
            <span>Private Polls</span>
          </h2>
          <p className="text-muted-foreground">
            Polls shared with you and your friend groups
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="polls">My Polls</TabsTrigger>
          <TabsTrigger value="group-invitations">
            Group Invitations
            {groupInvitations.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {groupInvitations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="poll-invitations">
            Poll Invitations
            {pollInvitations.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pollInvitations.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Private Polls */}
        <TabsContent value="polls" className="space-y-4">
          {polls.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  No Private Polls Yet
                </h3>
                <p className="text-muted-foreground">
                  You don&apos;t have access to any private polls yet. Create
                  some friend groups or wait for invitations.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {polls.map(poll => (
                <Card
                  key={poll.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-2">
                        {poll.option_a_label || 'Option A'} vs{' '}
                        {poll.option_b_label || 'Option B'}
                      </CardTitle>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(poll.status)}
                      </div>
                    </div>
                    {poll.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {poll.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(poll.status)}>
                          {poll.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(poll.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Poll ID: {poll.id.slice(0, 8)}...
                      </span>
                      <Button size="sm" variant="outline">
                        View Poll
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Group Invitations */}
        <TabsContent value="group-invitations" className="space-y-4">
          {groupInvitations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  No Group Invitations
                </h3>
                <p className="text-muted-foreground">
                  You don&apos;t have any pending group invitations.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {groupInvitations.map(invitation => (
                <Card key={invitation.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Users className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold">
                            {invitation.group_name}
                          </h3>
                          <Badge variant="outline">Group Invitation</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Invited by {invitation.inviter_name}
                        </p>
                        {invitation.message && (
                          <p className="text-sm">{invitation.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(invitation.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleRespondToGroupInvitation(
                              invitation.id,
                              'declined'
                            )
                          }
                        >
                          Decline
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            handleRespondToGroupInvitation(
                              invitation.id,
                              'accepted'
                            )
                          }
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Join Group
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Poll Invitations */}
        <TabsContent value="poll-invitations" className="space-y-4">
          {pollInvitations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Vote className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  No Poll Invitations
                </h3>
                <p className="text-muted-foreground">
                  You don&apos;t have any pending poll invitations.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pollInvitations.map(invitation => (
                <Card key={invitation.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Vote className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold">
                            {invitation.poll_title}
                          </h3>
                          <Badge variant="outline">Poll Invitation</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Invited by {invitation.inviter_name}
                        </p>
                        {invitation.message && (
                          <p className="text-sm">{invitation.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(invitation.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleRespondToPollInvitation(
                              invitation.id,
                              'declined'
                            )
                          }
                        >
                          Decline
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            handleRespondToPollInvitation(
                              invitation.id,
                              'accepted'
                            )
                          }
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accept
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
