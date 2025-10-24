import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database';

type PollShare = Database['public']['Tables']['poll_shares']['Row'];
type PollShareInsert = Database['public']['Tables']['poll_shares']['Insert'];
type PollInvitation = Database['public']['Tables']['poll_invitations']['Row'];
type PollInvitationInsert =
  Database['public']['Tables']['poll_invitations']['Insert'];

export interface PollWithAccess {
  poll_id: string;
  title: string;
  description: string | null;
  privacy_level: 'public' | 'private' | 'group';
  friend_group_id: string | null;
  created_at: string;
  access_level: 'view' | 'view_vote' | 'admin';
}

export interface PollInvitationWithDetails extends PollInvitation {
  poll_title: string;
  inviter_name: string;
}

export interface PollAccessUser {
  user_id: string;
  display_name: string | null;
  email: string;
  access_level: 'view' | 'view_vote' | 'admin';
  shared_at: string;
  shared_by: string;
}

export class PollPrivacyService {
  /**
   * Check if user has access to poll
   */
  static async hasPollAccess(pollId: string, userId: string): Promise<boolean> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase.rpc('user_has_poll_access', {
        p_user_id: userId,
        p_poll_id: pollId,
      });

      if (error) {
        console.error('Error checking poll access:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Error in hasPollAccess:', error);
      return false;
    }
  }

  /**
   * Get user's accessible polls
   */
  static async getUserAccessiblePolls(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<PollWithAccess[]> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase.rpc('get_user_accessible_polls', {
        p_user_id: userId,
        p_limit: limit,
        p_offset: offset,
      });

      if (error) {
        console.error('Error fetching accessible polls:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserAccessiblePolls:', error);
      return [];
    }
  }

  /**
   * Share poll with user
   */
  static async sharePoll(
    pollId: string,
    userId: string,
    sharedBy: string,
    accessLevel: 'view' | 'view_vote' | 'admin' = 'view_vote',
    expiresAt?: string
  ): Promise<boolean> {
    try {
      const supabase = createClient();

      const shareData = {
        poll_id: pollId,
        user_id: userId,
        shared_by: sharedBy,
        access_level: accessLevel,
        expires_at: expiresAt || null,
      };

      const { error } = await supabase.from('poll_shares').upsert(shareData, {
        onConflict: 'poll_id,user_id',
      });

      if (error) {
        console.error('Error sharing poll:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in sharePoll:', error);
      return false;
    }
  }

  /**
   * Revoke poll access
   */
  static async revokePollAccess(
    pollId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('poll_shares')
        .delete()
        .eq('poll_id', pollId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error revoking poll access:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in revokePollAccess:', error);
      return false;
    }
  }

  /**
   * Update poll access level
   */
  static async updatePollAccess(
    pollId: string,
    userId: string,
    accessLevel: 'view' | 'view_vote' | 'admin'
  ): Promise<boolean> {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('poll_shares')
        .update({ access_level: accessLevel })
        .eq('poll_id', pollId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating poll access:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updatePollAccess:', error);
      return false;
    }
  }

  /**
   * Get poll access list
   */
  static async getPollAccessList(pollId: string): Promise<PollAccessUser[]> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('poll_shares')
        .select('*')
        .eq('poll_id', pollId)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching poll access list:', error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Fetch user details separately
      const userIds = [...new Set(data.map(share => share.user_id))];
      const sharedByIds = [...new Set(data.map(share => share.shared_by))];

      const { data: users } = await supabase
        .from('profiles')
        .select('user_id, display_name, email')
        .in('user_id', [...userIds, ...sharedByIds]);

      const userMap = new Map(users?.map(u => [u.user_id, u]) || []);

      return data.map(share => ({
        user_id: share.user_id,
        display_name: userMap.get(share.user_id)?.display_name || null,
        email: userMap.get(share.user_id)?.email || 'Unknown',
        access_level: share.access_level,
        shared_at: share.shared_at,
        shared_by: userMap.get(share.shared_by)?.email || 'Unknown',
      }));
    } catch (error) {
      console.error('Error in getPollAccessList:', error);
      return [];
    }
  }

  /**
   * Invite user to poll
   */
  static async inviteUserToPoll(
    pollId: string,
    userId: string,
    invitedBy: string,
    message?: string
  ): Promise<boolean> {
    try {
      const supabase = createClient();

      const invitationData: PollInvitationInsert = {
        poll_id: pollId,
        invited_user_id: userId,
        invited_by: invitedBy,
        message: message || null,
      };

      const { error } = await supabase
        .from('poll_invitations')
        .insert(invitationData);

      if (error) {
        console.error('Error inviting user to poll:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in inviteUserToPoll:', error);
      return false;
    }
  }

  /**
   * Get user's poll invitations
   */
  static async getUserPollInvitations(
    userId: string
  ): Promise<PollInvitationWithDetails[]> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('poll_invitations')
        .select('*')
        .eq('invited_user_id', userId)
        .eq('status', 'pending');

      if (error) {
        console.error('Error fetching poll invitations:', error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Fetch poll and inviter details separately
      const pollIds = [...new Set(data.map(inv => inv.poll_id))];
      const inviterIds = [...new Set(data.map(inv => inv.invited_by))];

      const { data: polls } = await supabase
        .from('polls')
        .select('id, option_a_label, option_b_label, description')
        .in('id', pollIds);

      const { data: inviters } = await supabase
        .from('profiles')
        .select('user_id, display_name, email')
        .in('user_id', inviterIds);

      const pollMap = new Map(polls?.map(p => [p.id, p]) || []);
      const inviterMap = new Map(inviters?.map(i => [i.user_id, i]) || []);

      return data.map(invitation => ({
        ...invitation,
        poll_title: (() => {
          const poll = pollMap.get(invitation.poll_id);
          return poll
            ? `${poll.option_a_label} vs ${poll.option_b_label}`
            : 'Unknown Poll';
        })(),
        inviter_name:
          inviterMap.get(invitation.invited_by)?.display_name ||
          inviterMap.get(invitation.invited_by)?.email ||
          'Unknown User',
      }));
    } catch (error) {
      console.error('Error in getUserPollInvitations:', error);
      return [];
    }
  }

  /**
   * Respond to poll invitation
   */
  static async respondToPollInvitation(
    invitationId: string,
    response: 'accepted' | 'declined'
  ): Promise<boolean> {
    try {
      const supabase = createClient();

      // Update invitation status
      const { data: invitation, error: updateError } = await supabase
        .from('poll_invitations')
        .update({
          status: response,
          responded_at: new Date().toISOString(),
        })
        .eq('id', invitationId)
        .select()
        .single();

      if (updateError || !invitation) {
        console.error('Error updating poll invitation:', updateError);
        return false;
      }

      // If accepted, share poll with user
      if (response === 'accepted') {
        const success = await this.sharePoll(
          invitation.poll_id,
          invitation.invited_user_id,
          invitation.invited_by,
          'view_vote'
        );

        if (!success) {
          console.error('Error sharing poll after accepting invitation');
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error in respondToPollInvitation:', error);
      return false;
    }
  }

  /**
   * Bulk share poll with multiple users
   */
  static async bulkSharePoll(
    pollId: string,
    userIds: string[],
    sharedBy: string,
    accessLevel: 'view' | 'view_vote' | 'admin' = 'view_vote'
  ): Promise<{ success: string[]; failed: string[] }> {
    const results = { success: [] as string[], failed: [] as string[] };

    for (const userId of userIds) {
      const success = await this.sharePoll(
        pollId,
        userId,
        sharedBy,
        accessLevel
      );
      if (success) {
        results.success.push(userId);
      } else {
        results.failed.push(userId);
      }
    }

    return results;
  }

  /**
   * Get poll privacy settings
   */
  static async getPollPrivacySettings(pollId: string): Promise<{
    privacy_level: 'public' | 'private' | 'group';
    friend_group_id: string | null;
    access_expires_at: string | null;
  } | null> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('polls')
        .select('privacy_level, friend_group_id, access_expires_at')
        .eq('id', pollId)
        .single();

      if (error) {
        console.error('Error fetching poll privacy settings:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getPollPrivacySettings:', error);
      return null;
    }
  }

  /**
   * Update poll privacy settings
   */
  static async updatePollPrivacy(
    pollId: string,
    privacyLevel: 'public' | 'private' | 'group',
    friendGroupId?: string | null,
    accessExpiresAt?: string | null
  ): Promise<boolean> {
    try {
      const supabase = createClient();

      const updates: Record<string, unknown> = {
        privacy_level: privacyLevel,
      };

      if (friendGroupId !== undefined) {
        updates.friend_group_id = friendGroupId;
      }

      if (accessExpiresAt !== undefined) {
        updates.access_expires_at = accessExpiresAt;
      }

      const { error } = await supabase
        .from('polls')
        .update(updates)
        .eq('id', pollId);

      if (error) {
        console.error('Error updating poll privacy:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updatePollPrivacy:', error);
      return false;
    }
  }
}
