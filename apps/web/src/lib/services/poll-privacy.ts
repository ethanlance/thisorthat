import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database';

type Poll = Database['public']['Tables']['polls']['Row'];
type PollInsert = Database['public']['Tables']['polls']['Insert'];
type PollShare = Database['public']['Tables']['poll_shares']['Row'];
type PollShareInsert = Database['public']['Tables']['poll_shares']['Insert'];
type PollInvitation = Database['public']['Tables']['poll_invitations']['Row'];
type PollInvitationInsert =
  Database['public']['Tables']['poll_invitations']['Insert'];

export interface PollPrivacySettings {
  privacy_level: 'public' | 'private' | 'group';
  friend_group_id?: string;
  access_expires_at?: string;
  invited_users?: string[];
  custom_message?: string;
}

export interface PollAccess {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  access_level: 'view' | 'view_vote' | 'admin';
  shared_at: string;
  expires_at: string | null;
  is_active: boolean;
}

export interface PollInvitationWithDetails extends PollInvitation {
  poll_title: string;
  inviter_name: string;
}

export class PollPrivacyService {
  /**
   * Create poll with privacy settings
   */
  static async createPollWithPrivacy(
    pollData: Omit<
      PollInsert,
      'privacy_level' | 'friend_group_id' | 'access_expires_at'
    >,
    privacySettings: PollPrivacySettings
  ): Promise<Poll | null> {
    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const pollInsertData: PollInsert = {
        ...pollData,
        creator_id: user.id,
        privacy_level: privacySettings.privacy_level,
        friend_group_id: privacySettings.friend_group_id || null,
        access_expires_at: privacySettings.access_expires_at || null,
      };

      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .insert(pollInsertData)
        .select()
        .single();

      if (pollError) {
        console.error('Error creating poll:', pollError);
        return null;
      }

      // If private poll, create shares for invited users
      if (
        privacySettings.privacy_level === 'private' &&
        privacySettings.invited_users?.length
      ) {
        await this.inviteUsersToPoll(
          poll.id,
          privacySettings.invited_users,
          privacySettings.custom_message
        );
      }

      return poll;
    } catch (error) {
      console.error('Error in createPollWithPrivacy:', error);
      return null;
    }
  }

  /**
   * Get user's accessible polls
   */
  static async getUserAccessiblePolls(
    limit: number = 50,
    offset: number = 0
  ): Promise<Poll[]> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase.rpc('get_user_accessible_polls', {
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
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
   * Check if user has access to poll
   */
  static async userHasPollAccess(
    pollId: string,
    userId?: string
  ): Promise<boolean> {
    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;

      if (!targetUserId) {
        return false;
      }

      const { data, error } = await supabase.rpc('user_has_poll_access', {
        p_user_id: targetUserId,
        p_poll_id: pollId,
      });

      if (error) {
        console.error('Error checking poll access:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Error in userHasPollAccess:', error);
      return false;
    }
  }

  /**
   * Get poll access list
   */
  static async getPollAccess(pollId: string): Promise<PollAccess[]> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('poll_shares')
        .select(
          `
          *,
          display_name:profiles(display_name),
          email:profiles(email)
        `
        )
        .eq('poll_id', pollId)
        .eq('is_active', true)
        .order('shared_at', { ascending: false });

      if (error) {
        console.error('Error fetching poll access:', error);
        return [];
      }

      return (data || []).map(share => ({
        id: share.id,
        user_id: share.user_id,
        display_name: share.display_name || 'Unknown User',
        email: share.email || 'unknown@example.com',
        access_level: share.access_level,
        shared_at: share.shared_at,
        expires_at: share.expires_at,
        is_active: share.is_active,
      }));
    } catch (error) {
      console.error('Error in getPollAccess:', error);
      return [];
    }
  }

  /**
   * Invite users to poll
   */
  static async inviteUsersToPoll(
    pollId: string,
    emails: string[],
    message?: string
  ): Promise<boolean> {
    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create invitations for each email
      const invitations: PollInvitationInsert[] = emails.map(email => ({
        poll_id: pollId,
        invited_user_id: '', // Will be set when user accepts
        invited_by: user.id,
        message: message || null,
      }));

      const { error } = await supabase
        .from('poll_invitations')
        .insert(invitations);

      if (error) {
        console.error('Error creating poll invitations:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in inviteUsersToPoll:', error);
      return false;
    }
  }

  /**
   * Get poll invitations
   */
  static async getPollInvitations(
    pollId: string
  ): Promise<PollInvitationWithDetails[]> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('poll_invitations')
        .select(
          `
          *,
          poll_title:polls(option_a_label, option_b_label),
          inviter_name:profiles!poll_invitations_invited_by_fkey(display_name)
        `
        )
        .eq('poll_id', pollId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching poll invitations:', error);
        return [];
      }

      return (data || []).map(invitation => ({
        ...invitation,
        poll_title: `${invitation.poll_title?.option_a_label} vs ${invitation.poll_title?.option_b_label}`,
        inviter_name: invitation.inviter_name || 'Unknown User',
      }));
    } catch (error) {
      console.error('Error in getPollInvitations:', error);
      return [];
    }
  }

  /**
   * Get user's poll invitations
   */
  static async getUserPollInvitations(): Promise<PollInvitationWithDetails[]> {
    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('poll_invitations')
        .select(
          `
          *,
          poll_title:polls(option_a_label, option_b_label),
          inviter_name:profiles!poll_invitations_invited_by_fkey(display_name)
        `
        )
        .eq('invited_user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user poll invitations:', error);
        return [];
      }

      return (data || []).map(invitation => ({
        ...invitation,
        poll_title: `${invitation.poll_title?.option_a_label} vs ${invitation.poll_title?.option_b_label}`,
        inviter_name: invitation.inviter_name || 'Unknown User',
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

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Update invitation status
      const { error: updateError } = await supabase
        .from('poll_invitations')
        .update({
          status: response,
          responded_at: new Date().toISOString(),
        })
        .eq('id', invitationId)
        .eq('invited_user_id', user.id);

      if (updateError) {
        console.error('Error responding to poll invitation:', updateError);
        return false;
      }

      // If accepted, create poll share
      if (response === 'accepted') {
        const { data: invitation } = await supabase
          .from('poll_invitations')
          .select('poll_id, invited_by')
          .eq('id', invitationId)
          .single();

        if (invitation) {
          const shareData: PollShareInsert = {
            poll_id: invitation.poll_id,
            user_id: user.id,
            shared_by: invitation.invited_by,
            access_level: 'view_vote',
          };

          await supabase.from('poll_shares').insert(shareData);
        }
      }

      return true;
    } catch (error) {
      console.error('Error in respondToPollInvitation:', error);
      return false;
    }
  }

  /**
   * Revoke poll access
   */
  static async revokePollAccess(shareId: string): Promise<boolean> {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('poll_shares')
        .update({ is_active: false })
        .eq('id', shareId);

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
   * Update poll privacy settings
   */
  static async updatePollPrivacy(
    pollId: string,
    privacySettings: Partial<PollPrivacySettings>
  ): Promise<boolean> {
    try {
      const supabase = createClient();

      const updateData: Partial<PollInsert> = {};

      if (privacySettings.privacy_level) {
        updateData.privacy_level = privacySettings.privacy_level;
      }
      if (privacySettings.friend_group_id !== undefined) {
        updateData.friend_group_id = privacySettings.friend_group_id;
      }
      if (privacySettings.access_expires_at !== undefined) {
        updateData.access_expires_at = privacySettings.access_expires_at;
      }

      const { error } = await supabase
        .from('polls')
        .update(updateData)
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

  /**
   * Get poll privacy statistics
   */
  static async getPollPrivacyStats(): Promise<{
    total_polls: number;
    public_polls: number;
    private_polls: number;
    group_polls: number;
    total_invitations: number;
    pending_invitations: number;
  }> {
    try {
      const supabase = createClient();

      const [pollsResult, invitationsResult] = await Promise.all([
        supabase.from('polls').select('privacy_level', { count: 'exact' }),
        supabase.from('poll_invitations').select('status', { count: 'exact' }),
      ]);

      const polls = pollsResult.data || [];
      const invitations = invitationsResult.data || [];

      return {
        total_polls: pollsResult.count || 0,
        public_polls: polls.filter(p => p.privacy_level === 'public').length,
        private_polls: polls.filter(p => p.privacy_level === 'private').length,
        group_polls: polls.filter(p => p.privacy_level === 'group').length,
        total_invitations: invitationsResult.count || 0,
        pending_invitations: invitations.filter(i => i.status === 'pending')
          .length,
      };
    } catch (error) {
      console.error('Error in getPollPrivacyStats:', error);
      return {
        total_polls: 0,
        public_polls: 0,
        private_polls: 0,
        group_polls: 0,
        total_invitations: 0,
        pending_invitations: 0,
      };
    }
  }
}
