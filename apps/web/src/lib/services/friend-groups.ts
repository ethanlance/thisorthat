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
  members: GroupMember[];
  member_count: number;
}

export interface GroupMemberWithProfile extends GroupMember {
  display_name: string | null;
  email: string;
  avatar_url: string | null;
}

export interface GroupInvitationWithDetails extends GroupInvitation {
  group_name: string;
  inviter_name: string;
}

export class FriendGroupService {
  /**
   * Create a new friend group
   */
  static async createGroup(
    name: string,
    description: string | null,
    isPublic: boolean = false,
    creatorId: string
  ): Promise<FriendGroup | null> {
    try {
      const supabase = createClient();

      const groupData: FriendGroupInsert = {
        name,
        description,
        is_public: isPublic,
        created_by: creatorId,
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
      await this.addMember(data.id, creatorId, 'admin', creatorId);

      return data;
    } catch (error) {
      console.error('Error in createGroup:', error);
      return null;
    }
  }

  /**
   * Get user's friend groups
   */
  static async getUserGroups(
    userId: string
  ): Promise<FriendGroupWithMembers[]> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('friend_groups')
        .select(
          `
          *,
          group_members!inner(*)
        `
        )
        .eq('group_members.user_id', userId);

      if (error) {
        console.error('Error fetching user groups:', error);
        return [];
      }

      return data.map(group => ({
        ...group,
        members: group.group_members,
        member_count: group.group_members.length,
      }));
    } catch (error) {
      console.error('Error in getUserGroups:', error);
      return [];
    }
  }

  /**
   * Get group details with members
   */
  static async getGroupDetails(
    groupId: string
  ): Promise<FriendGroupWithMembers | null> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('friend_groups')
        .select(
          `
          *,
          group_members(*)
        `
        )
        .eq('id', groupId)
        .single();

      if (error) {
        console.error('Error fetching group details:', error);
        return null;
      }

      return {
        ...data,
        members: data.group_members,
        member_count: data.group_members.length,
      };
    } catch (error) {
      console.error('Error in getGroupDetails:', error);
      return null;
    }
  }

  /**
   * Add member to group
   */
  static async addMember(
    groupId: string,
    userId: string,
    role: 'admin' | 'member' = 'member',
    invitedBy: string
  ): Promise<boolean> {
    try {
      const supabase = createClient();

      const memberData: GroupMemberInsert = {
        group_id: groupId,
        user_id: userId,
        role,
        invited_by: invitedBy,
      };

      const { error } = await supabase.from('group_members').insert(memberData);

      if (error) {
        console.error('Error adding group member:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in addMember:', error);
      return false;
    }
  }

  /**
   * Remove member from group
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
        console.error('Error removing group member:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in removeMember:', error);
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
   * Get group members with profiles
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
   * Invite user to group
   */
  static async inviteUser(
    groupId: string,
    userId: string,
    invitedBy: string,
    message?: string
  ): Promise<boolean> {
    try {
      const supabase = createClient();

      const invitationData: GroupInvitationInsert = {
        group_id: groupId,
        invited_user_id: userId,
        invited_by: invitedBy,
        message: message || null,
      };

      const { error } = await supabase
        .from('group_invitations')
        .insert(invitationData);

      if (error) {
        console.error('Error inviting user to group:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in inviteUser:', error);
      return false;
    }
  }

  /**
   * Get user's group invitations
   */
  static async getUserInvitations(
    userId: string
  ): Promise<GroupInvitationWithDetails[]> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('group_invitations')
        .select('*')
        .eq('invited_user_id', userId)
        .eq('status', 'pending');

      if (error) {
        console.error('Error fetching user invitations:', error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Fetch group and inviter details separately
      const groupIds = [...new Set(data.map(inv => inv.group_id))];
      const inviterIds = [...new Set(data.map(inv => inv.invited_by))];

      const { data: groups } = await supabase
        .from('friend_groups')
        .select('id, name')
        .in('id', groupIds);

      const { data: inviters } = await supabase
        .from('profiles')
        .select('user_id, display_name, email')
        .in('user_id', inviterIds);

      const groupMap = new Map(groups?.map(g => [g.id, g]) || []);
      const inviterMap = new Map(inviters?.map(i => [i.user_id, i]) || []);

      return data.map(invitation => ({
        ...invitation,
        group_name: groupMap.get(invitation.group_id)?.name || 'Unknown Group',
        inviter_name:
          inviterMap.get(invitation.invited_by)?.display_name ||
          inviterMap.get(invitation.invited_by)?.email ||
          'Unknown User',
      }));
    } catch (error) {
      console.error('Error in getUserInvitations:', error);
      return [];
    }
  }

  /**
   * Respond to group invitation
   */
  static async respondToInvitation(
    invitationId: string,
    response: 'accepted' | 'declined'
  ): Promise<boolean> {
    try {
      const supabase = createClient();

      // Update invitation status
      const { data: invitation, error: updateError } = await supabase
        .from('group_invitations')
        .update({
          status: response,
          responded_at: new Date().toISOString(),
        })
        .eq('id', invitationId)
        .select()
        .single();

      if (updateError || !invitation) {
        console.error('Error updating invitation:', updateError);
        return false;
      }

      // If accepted, add user to group
      if (response === 'accepted') {
        const success = await this.addMember(
          invitation.group_id,
          invitation.invited_user_id,
          'member',
          invitation.invited_by
        );

        if (!success) {
          console.error(
            'Error adding user to group after accepting invitation'
          );
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error in respondToInvitation:', error);
      return false;
    }
  }

  /**
   * Check if user is member of group
   */
  static async isGroupMember(
    groupId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .single();

      if (error) {
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in isGroupMember:', error);
      return false;
    }
  }

  /**
   * Check if user is group admin
   */
  static async isGroupAdmin(groupId: string, userId: string): Promise<boolean> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .eq('role', 'admin')
        .single();

      if (error) {
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in isGroupAdmin:', error);
      return false;
    }
  }

  /**
   * Search public groups
   */
  static async searchPublicGroups(
    query: string,
    limit: number = 20
  ): Promise<FriendGroup[]> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('friend_groups')
        .select('*')
        .eq('is_public', true)
        .ilike('name', `%${query}%`)
        .limit(limit);

      if (error) {
        console.error('Error searching public groups:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in searchPublicGroups:', error);
      return [];
    }
  }

  /**
   * Update group settings
   */
  static async updateGroup(
    groupId: string,
    updates: {
      name?: string;
      description?: string;
      is_public?: boolean;
    }
  ): Promise<boolean> {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('friend_groups')
        .update(updates)
        .eq('id', groupId);

      if (error) {
        console.error('Error updating group:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateGroup:', error);
      return false;
    }
  }

  /**
   * Delete group
   */
  static async deleteGroup(groupId: string): Promise<boolean> {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('friend_groups')
        .delete()
        .eq('id', groupId);

      if (error) {
        console.error('Error deleting group:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteGroup:', error);
      return false;
    }
  }
}
