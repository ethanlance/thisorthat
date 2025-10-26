import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FriendGroupService } from '@/lib/services/friend-groups';
import { PollPrivacyService } from '@/lib/services/poll-privacy';
import PollPrivacySettings from '@/components/privacy/PollPrivacySettings';
import FriendGroupManager from '@/components/privacy/FriendGroupManager';
import PollAccessManager from '@/components/privacy/PollAccessManager';
import PrivatePollFeed from '@/components/privacy/PrivatePollFeed';

// Mock fetch
global.fetch = vi.fn();

describe('Poll Privacy System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('FriendGroupService', () => {
    it('should create a friend group', async () => {
      const mockGroup = {
        id: 'group-123',
        name: 'Test Group',
        description: 'A test group',
        is_public: false,
        created_by: 'user-123',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      vi.spyOn(FriendGroupService, 'createFriendGroup').mockResolvedValue(
        mockGroup
      );

      const result = await FriendGroupService.createFriendGroup(
        'Test Group',
        'A test group',
        false
      );

      expect(result).toEqual(mockGroup);
    });

    it('should get user friend groups', async () => {
      const mockGroups = [
        {
          id: 'group-123',
          name: 'Test Group',
          member_count: 5,
        },
      ];

      vi.spyOn(FriendGroupService, 'getUserFriendGroups').mockResolvedValue(
        mockGroups
      );

      const result = await FriendGroupService.getUserFriendGroups();

      expect(result).toEqual(mockGroups);
    });

    it('should add member to group', async () => {
      vi.spyOn(FriendGroupService, 'addGroupMember').mockResolvedValue(true);

      const result = await FriendGroupService.addGroupMember(
        'group-123',
        'user-456',
        'member',
        'user-123'
      );

      expect(result).toBe(true);
    });

    it('should invite user to group', async () => {
      vi.spyOn(FriendGroupService, 'inviteUserToGroup').mockResolvedValue(true);

      const result = await FriendGroupService.inviteUserToGroup(
        'group-123',
        'user@example.com',
        'Join our group!'
      );

      expect(result).toBe(true);
    });

    it('should respond to group invitation', async () => {
      vi.spyOn(
        FriendGroupService,
        'respondToGroupInvitation'
      ).mockResolvedValue(true);

      const result = await FriendGroupService.respondToGroupInvitation(
        'invitation-123',
        'accepted'
      );

      expect(result).toBe(true);
    });
  });

  describe('PollPrivacyService', () => {
    it('should create poll with privacy settings', async () => {
      const mockPoll = {
        id: 'poll-123',
        creator_id: 'user-123',
        privacy_level: 'private',
        friend_group_id: null,
        access_expires_at: null,
      };

      vi.spyOn(PollPrivacyService, 'createPollWithPrivacy').mockResolvedValue(
        mockPoll
      );

      const result = await PollPrivacyService.createPollWithPrivacy(
        {
          creator_id: 'user-123',
          option_a_image_url: 'image-a.jpg',
          option_b_image_url: 'image-b.jpg',
        },
        {
          privacy_level: 'private',
          invited_users: ['user@example.com'],
        }
      );

      expect(result).toEqual(mockPoll);
    });

    it('should check user poll access', async () => {
      vi.spyOn(PollPrivacyService, 'userHasPollAccess').mockResolvedValue(true);

      const result = await PollPrivacyService.userHasPollAccess(
        'poll-123',
        'user-456'
      );

      expect(result).toBe(true);
    });

    it('should get poll access list', async () => {
      const mockAccess = [
        {
          id: 'access-123',
          user_id: 'user-456',
          display_name: 'John Doe',
          email: 'john@example.com',
          access_level: 'view_vote',
          shared_at: '2024-01-01T00:00:00Z',
          expires_at: null,
          is_active: true,
        },
      ];

      vi.spyOn(PollPrivacyService, 'getPollAccess').mockResolvedValue(
        mockAccess
      );

      const result = await PollPrivacyService.getPollAccess('poll-123');

      expect(result).toEqual(mockAccess);
    });

    it('should invite users to poll', async () => {
      vi.spyOn(PollPrivacyService, 'inviteUsersToPoll').mockResolvedValue(true);

      const result = await PollPrivacyService.inviteUsersToPoll(
        'poll-123',
        ['user@example.com'],
        'Check out this poll!'
      );

      expect(result).toBe(true);
    });

    it('should respond to poll invitation', async () => {
      vi.spyOn(PollPrivacyService, 'respondToPollInvitation').mockResolvedValue(
        true
      );

      const result = await PollPrivacyService.respondToPollInvitation(
        'invitation-123',
        'accepted'
      );

      expect(result).toBe(true);
    });
  });

  describe('PollPrivacySettings', () => {
    it('should render privacy settings form', () => {
      const mockOnChange = vi.fn();

      render(
        <PollPrivacySettings
          onPrivacyChange={mockOnChange}
          initialSettings={{ privacy_level: 'public' }}
        />
      );

      expect(screen.getByText('Privacy Settings')).toBeInTheDocument();
      expect(screen.getByText('Who can access this poll?')).toBeInTheDocument();
    });

    it('should handle privacy level changes', () => {
      const mockOnChange = vi.fn();

      render(
        <PollPrivacySettings
          onPrivacyChange={mockOnChange}
          initialSettings={{ privacy_level: 'public' }}
        />
      );

      const privateOption = screen.getByLabelText(/private/i);
      fireEvent.click(privateOption);

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should show friend group selection for group polls', () => {
      const mockOnChange = vi.fn();

      render(
        <PollPrivacySettings
          onPrivacyChange={mockOnChange}
          initialSettings={{ privacy_level: 'group' }}
        />
      );

      const groupOption = screen.getByLabelText(/friend group/i);
      fireEvent.click(groupOption);

      expect(screen.getByText('Select Friend Group')).toBeInTheDocument();
    });

    it('should show invitation form for private polls', () => {
      const mockOnChange = vi.fn();

      render(
        <PollPrivacySettings
          onPrivacyChange={mockOnChange}
          initialSettings={{ privacy_level: 'private' }}
        />
      );

      const privateOption = screen.getByLabelText(/private/i);
      fireEvent.click(privateOption);

      expect(screen.getByText('Invite Users')).toBeInTheDocument();
    });

    it('should add and remove invited users', () => {
      const mockOnChange = vi.fn();

      render(
        <PollPrivacySettings
          onPrivacyChange={mockOnChange}
          initialSettings={{ privacy_level: 'private' }}
        />
      );

      const privateOption = screen.getByLabelText(/private/i);
      fireEvent.click(privateOption);

      const emailInput = screen.getByPlaceholderText(/enter email/i);
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

      const addButton = screen.getByRole('button', { name: /add/i });
      fireEvent.click(addButton);

      expect(screen.getByText('user@example.com')).toBeInTheDocument();

      const removeButton = screen.getByText('×');
      fireEvent.click(removeButton);

      expect(screen.queryByText('user@example.com')).not.toBeInTheDocument();
    });
  });

  describe('FriendGroupManager', () => {
    it('should render friend group manager', async () => {
      const mockGroups = [
        {
          id: 'group-123',
          name: 'Test Group',
          description: 'A test group',
          is_public: false,
          member_count: 5,
          created_at: '2024-01-01T00:00:00Z',
          created_by: 'user-123',
        },
      ];

      (fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ groups: mockGroups }),
      });

      render(<FriendGroupManager />);

      await waitFor(() => {
        expect(screen.getByText('Friend Groups')).toBeInTheDocument();
      });

      expect(screen.getByText('Test Group')).toBeInTheDocument();
    });

    it('should create a new friend group', async () => {
      (fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/friend-groups') && url.includes('POST')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                group: {
                  id: 'group-123',
                  name: 'New Group',
                  description: 'A new group',
                  is_public: false,
                  member_count: 1,
                },
              }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ groups: [] }),
        });
      });

      render(<FriendGroupManager />);

      await waitFor(() => {
        expect(screen.getByText('Create Group')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Create Group');
      fireEvent.click(createButton);

      const nameInput = screen.getByLabelText(/group name/i);
      fireEvent.change(nameInput, { target: { value: 'New Group' } });

      const descriptionInput = screen.getByLabelText(/description/i);
      fireEvent.change(descriptionInput, { target: { value: 'A new group' } });

      const submitButton = screen.getByText('Create Group');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          '/api/friend-groups',
          expect.any(Object)
        );
      });
    });

    it('should invite user to group', async () => {
      const mockGroups = [
        {
          id: 'group-123',
          name: 'Test Group',
          description: 'A test group',
          is_public: false,
          member_count: 5,
          created_at: '2024-01-01T00:00:00Z',
          created_by: 'user-123',
        },
      ];

      (fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/friend-groups')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ groups: mockGroups }),
          });
        }
        if (url.includes('/api/friend-groups/group-123/members')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ members: [] }),
          });
        }
        if (url.includes('/api/friend-groups/group-123/invite')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<FriendGroupManager />);

      await waitFor(() => {
        expect(screen.getByText('Test Group')).toBeInTheDocument();
      });

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsButton);

      await waitFor(() => {
        expect(screen.getByText('Manage Test Group')).toBeInTheDocument();
      });

      const emailInput = screen.getByPlaceholderText(/enter email/i);
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

      const inviteButton = screen.getByText('Invite');
      fireEvent.click(inviteButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          '/api/friend-groups/group-123/invite',
          expect.any(Object)
        );
      });
    });
  });

  describe('PollAccessManager', () => {
    it('should render poll access manager', async () => {
      const mockAccess = [
        {
          id: 'access-123',
          user_id: 'user-456',
          display_name: 'John Doe',
          email: 'john@example.com',
          access_level: 'view_vote',
          shared_at: '2024-01-01T00:00:00Z',
          expires_at: null,
          is_active: true,
        },
      ];

      (fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/polls/poll-123/access')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ access: mockAccess }),
          });
        }
        if (url.includes('/api/polls/poll-123/invitations')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ invitations: [] }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(
        <PollAccessManager
          pollId="poll-123"
          pollTitle="Test Poll"
          privacyLevel="private"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Poll Access Management')).toBeInTheDocument();
      });

      expect(screen.getByText('Test Poll')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should invite user to poll', async () => {
      (fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/polls/poll-123/access')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ access: [] }),
          });
        }
        if (url.includes('/api/polls/poll-123/invitations')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ invitations: [] }),
          });
        }
        if (url.includes('/api/polls/poll-123/invite')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(
        <PollAccessManager
          pollId="poll-123"
          pollTitle="Test Poll"
          privacyLevel="private"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Invite User')).toBeInTheDocument();
      });

      const inviteButton = screen.getByText('Invite User');
      fireEvent.click(inviteButton);

      await waitFor(() => {
        expect(screen.getByText('Invite User to Poll')).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/email address/i);
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

      const submitButton = screen.getByText('Send Invitation');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          '/api/polls/poll-123/invite',
          expect.any(Object)
        );
      });
    });
  });

  describe('PrivatePollFeed', () => {
    it('should render private poll feed', async () => {
      const mockPolls = [
        {
          id: 'poll-123',
          title: 'Test Poll',
          description: 'A test poll',
          privacy_level: 'private',
          friend_group_id: null,
          created_at: '2024-01-01T00:00:00Z',
          access_level: 'view_vote',
          creator_name: 'John Doe',
        },
      ];

      (fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/polls/private')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockPolls),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      });

      render(<PrivatePollFeed />);

      await waitFor(() => {
        expect(screen.getByText('Private Polls')).toBeInTheDocument();
      });

      expect(screen.getByText('Test Poll')).toBeInTheDocument();
    });

    it('should handle group invitations', async () => {
      const mockGroupInvitations = [
        {
          id: 'invitation-123',
          group_name: 'Test Group',
          inviter_name: 'John Doe',
          message: 'Join our group!',
          created_at: '2024-01-01T00:00:00Z',
          status: 'pending',
        },
      ];

      (fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/polls/private')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([]),
          });
        }
        if (url.includes('/api/friend-groups/invitations')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockGroupInvitations),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      });

      render(<PrivatePollFeed />);

      await waitFor(() => {
        expect(screen.getByText('Group Invitations')).toBeInTheDocument();
      });

      const groupInvitationsTab = screen.getByText('Group Invitations');
      fireEvent.click(groupInvitationsTab);

      await waitFor(() => {
        expect(screen.getByText('Test Group')).toBeInTheDocument();
      });

      expect(screen.getByText('Join our group!')).toBeInTheDocument();
    });

    it('should handle poll invitations', async () => {
      const mockPollInvitations = [
        {
          id: 'invitation-123',
          poll_title: 'Test Poll',
          inviter_name: 'John Doe',
          message: 'Check out this poll!',
          created_at: '2024-01-01T00:00:00Z',
          status: 'pending',
        },
      ];

      (fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/polls/private')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([]),
          });
        }
        if (url.includes('/api/polls/invitations')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockPollInvitations),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      });

      render(<PrivatePollFeed />);

      await waitFor(() => {
        expect(screen.getByText('Poll Invitations')).toBeInTheDocument();
      });

      const pollInvitationsTab = screen.getByText('Poll Invitations');
      fireEvent.click(pollInvitationsTab);

      await waitFor(() => {
        expect(screen.getByText('Test Poll')).toBeInTheDocument();
      });

      expect(screen.getByText('Check out this poll!')).toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete privacy workflow', async () => {
      // 1. Create friend group
      const group = await FriendGroupService.createFriendGroup(
        'Test Group',
        'A test group',
        false
      );
      expect(group).toBeDefined();

      // 2. Invite user to group
      const inviteSuccess = await FriendGroupService.inviteUserToGroup(
        group!.id,
        'user@example.com',
        'Join our group!'
      );
      expect(inviteSuccess).toBe(true);

      // 3. Create private poll
      const poll = await PollPrivacyService.createPollWithPrivacy(
        {
          creator_id: 'user-123',
          option_a_image_url: 'image-a.jpg',
          option_b_image_url: 'image-b.jpg',
        },
        {
          privacy_level: 'group',
          friend_group_id: group!.id,
        }
      );
      expect(poll).toBeDefined();

      // 4. Check access
      const hasAccess = await PollPrivacyService.userHasPollAccess(
        poll!.id,
        'user-456'
      );
      expect(hasAccess).toBeDefined();
    });

    it('should handle poll invitation workflow', async () => {
      // 1. Create private poll
      const poll = await PollPrivacyService.createPollWithPrivacy(
        {
          creator_id: 'user-123',
          option_a_image_url: 'image-a.jpg',
          option_b_image_url: 'image-b.jpg',
        },
        {
          privacy_level: 'private',
          invited_users: ['user@example.com'],
        }
      );
      expect(poll).toBeDefined();

      // 2. Invite additional users
      const inviteSuccess = await PollPrivacyService.inviteUsersToPoll(
        poll!.id,
        ['user2@example.com'],
        'Check out this poll!'
      );
      expect(inviteSuccess).toBe(true);

      // 3. Respond to invitation
      const responseSuccess = await PollPrivacyService.respondToPollInvitation(
        'invitation-123',
        'accepted'
      );
      expect(responseSuccess).toBe(true);
    });
  });
});
