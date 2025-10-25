import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database';

type FriendGroup = Database['public']['Tables']['friend_groups']['Row'];
type FriendGroupInsert =
  Database['public']['Tables']['friend_groups']['Insert'];
type GroupMember = Database['public']['Tables']['group_members']['Row'];
type GroupMemberInsert =
  Database['public']['Tables']['group_members']['Insert'];
type GroupInvitation = Database['public']['Tables']['group_invitations']['Row'];
type GroupInvitationInsert =
  Database['public']['Tables']['group_invitations']['Insert'];

export interface FriendGroupWithMembers extends FriendGroup {
  member_count: number;
  members?: GroupMember[];
}

export interface GroupMemberWithProfile extends GroupMember {
  display_name: string;
  email: string;
}

export interface GroupInvitationWithDetails extends GroupInvitation {
  group_name: string;
  inviter_name: string;
}

export class FriendGroupService {
  /**
   * Get user's friend groups
   */
  static async getUserFriendGroups(): Promise<FriendGroupWithMembers[]> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase.rpc('get_user_friend_groups');

      if (error) {
        console.error('Error fetching friend groups:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserFriendGroups:', error);
      return [];
    }
  }

  /**
   * Get public friend groups
   */
  static async getPublicFriendGroups(
    limit: number = 20,
    offset: number = 0
  ): Promise<FriendGroupWithMembers[]> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('friend_groups')
        .select(
          `
          *,
          member_count:group_members(count)
        `
        )
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching public friend groups:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPublicFriendGroups:', error);
      return [];
    }
  }

  /**
   * Create a new friend group
   */
  static async createFriendGroup(
    name: string,
    description?: string,
    isPublic: boolean = false
  ): Promise<FriendGroup | null> {
    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const groupData: FriendGroupInsert = {
        name,
        description: description || null,
        is_public: isPublic,
        created_by: user.id,
      };

      const { data, error } = await supabase
        .from('friend_groups')
        .insert(groupData)
        .select()
        .single();

      if (error) {
        console.error('Error creating friend group:', error);
        return null;
      }

      // Add creator as admin member
      await this.addGroupMember(data.id, user.id, 'admin');

      return data;
    } catch (error) {
      console.error('Error in createFriendGroup:', error);
      return null;
    }
  }

  /**
   * Update friend group
   */
  static async updateFriendGroup(
    groupId: string,
    updates: Partial<Pick<FriendGroup, 'name' | 'description' | 'is_public'>>
  ): Promise<boolean> {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('friend_groups')
        .update(updates)
        .eq('id', groupId);

      if (error) {
        console.error('Error updating friend group:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateFriendGroup:', error);
      return false;
    }
  }

  /**
   * Delete friend group
   */
  static async deleteFriendGroup(groupId: string): Promise<boolean> {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('friend_groups')
        .delete()
        .eq('id', groupId);

      if (error) {
        console.error('Error deleting friend group:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteFriendGroup:', error);
      return false;
    }
  }

  /**
   * Get group members
   */
  static async getGroupMembers(
    groupId: string
  ): Promise<GroupMemberWithProfile[]> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase.rpc('get_group_members', {
        p_group_id: groupId,
      });

      if (error) {
        console.error('Error fetching group members:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getGroupMembers:', error);
      return [];
    }
  }

  /**
   * Add member to group
   */
  static async addGroupMember(
    groupId: string,
    userId: string,
    role: 'admin' | 'member' = 'member',
    invitedBy?: string
  ): Promise<boolean> {
    try {
      const supabase = createClient();

      const memberData: GroupMemberInsert = {
        group_id: groupId,
        user_id: userId,
        role,
        invited_by: invitedBy || null,
      };

      const { error } = await supabase.from('group_members').insert(memberData);

      if (error) {
        console.error('Error adding group member:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in addGroupMember:', error);
      return false;
    }
  }

  /**
   * Remove member from group
   */
  static async removeGroupMember(
    groupId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error removing group member:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in removeGroupMember:', error);
      return false;
    }
  }

  /**
   * Update member role
   */
  static async updateMemberRole(
    groupId: string,
    userId: string,
    role: 'admin' | 'member'
  ): Promise<boolean> {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('group_members')
        .update({ role })
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating member role:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateMemberRole:', error);
      return false;
    }
  }

  /**
   * Invite user to group
   */
  static async inviteUserToGroup(
    groupId: string,
    email: string,
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

      // First, try to find user by email
      const { data: userData } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (userData) {
        // User exists, add them directly
        return await this.addGroupMember(
          groupId,
          userData.id,
          'member',
          user.id
        );
      } else {
        // User doesn't exist, create invitation
        const invitationData: GroupInvitationInsert = {
          group_id: groupId,
          invited_user_id: '', // Will be set when user signs up
          invited_by: user.id,
          message: message || null,
        };

        const { error } = await supabase
          .from('group_invitations')
          .insert(invitationData);

        if (error) {
          console.error('Error creating group invitation:', error);
          return false;
        }

        return true;
      }
    } catch (error) {
      console.error('Error in inviteUserToGroup:', error);
      return false;
    }
  }

  /**
   * Get user's group invitations
   */
  static async getUserGroupInvitations(): Promise<
    GroupInvitationWithDetails[]
  > {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('group_invitations')
        .select(
          `
          *,
          group_name:friend_groups(name),
          inviter_name:profiles!group_invitations_invited_by_fkey(display_name)
        `
        )
        .eq('invited_user_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching group invitations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserGroupInvitations:', error);
      return [];
    }
  }

  /**
   * Respond to group invitation
   */
  static async respondToGroupInvitation(
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
        .from('group_invitations')
        .update({
          status: response,
          responded_at: new Date().toISOString(),
        })
        .eq('id', invitationId)
        .eq('invited_user_id', user.id);

      if (updateError) {
        console.error('Error responding to group invitation:', updateError);
        return false;
      }

      // If accepted, add user to group
      if (response === 'accepted') {
        const { data: invitation } = await supabase
          .from('group_invitations')
          .select('group_id, invited_by')
          .eq('id', invitationId)
          .single();

        if (invitation) {
          await this.addGroupMember(
            invitation.group_id,
            user.id,
            'member',
            invitation.invited_by
          );
        }
      }

      return true;
    } catch (error) {
      console.error('Error in respondToGroupInvitation:', error);
      return false;
    }
  }

  /**
   * Check if user is member of group
   */
  static async isUserGroupMember(
    groupId: string,
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

      const { data, error } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', targetUserId)
        .single();

      if (error) {
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in isUserGroupMember:', error);
      return false;
    }
  }

  /**
   * Get group statistics
   */
  static async getGroupStats(groupId: string): Promise<{
    member_count: number;
    poll_count: number;
    active_polls: number;
  }> {
    try {
      const supabase = createClient();

      const [memberResult, pollResult] = await Promise.all([
        supabase
          .from('group_members')
          .select('id', { count: 'exact' })
          .eq('group_id', groupId),
        supabase
          .from('polls')
          .select('id, status', { count: 'exact' })
          .eq('friend_group_id', groupId),
      ]);

      return {
        member_count: memberResult.count || 0,
        poll_count: pollResult.count || 0,
        active_polls: (pollResult.data || []).filter(p => p.status === 'active')
          .length,
      };
    } catch (error) {
      console.error('Error in getGroupStats:', error);
      return {
        member_count: 0,
        poll_count: 0,
        active_polls: 0,
      };
    }
  }

  /**
   * Check if a user is an admin of a friend group
   */
  static async isGroupAdmin(groupId: string, userId: string): Promise<boolean> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return false;
      }

      return data.role === 'admin';
    } catch (error) {
      console.error('Error in isGroupAdmin:', error);
      return false;
    }
  }

  /**
   * Remove a member from a friend group
   */
  static async removeMember(groupId: string, userId: string): Promise<boolean> {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error removing member:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in removeMember:', error);
      return false;
    }
  }

  /**
   * Get group details with members
   */
  static async getGroupDetails(groupId: string): Promise<FriendGroupWithMembers | null> {
    try {
      const supabase = createClient();
      const { data: group, error: groupError } = await supabase
        .from('friend_groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupError || !group) {
        return null;
      }

      const { data: members, error: membersError } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId);

      if (membersError) {
        console.error('Error fetching members:', membersError);
        return null;
      }

      return {
        ...group,
        member_count: members?.length || 0,
        members: members || [],
      };
    } catch (error) {
      console.error('Error in getGroupDetails:', error);
      return null;
    }
  }
}
