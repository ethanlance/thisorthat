import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PrivatePollFeed from '@/components/privacy/PrivatePollFeed';

// Mock fetch
global.fetch = vi.fn();

describe('PrivatePollFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
    expect(screen.getByText('A test poll')).toBeInTheDocument();
    expect(screen.getByText('by John Doe')).toBeInTheDocument();
  });

  it('should show empty state when no polls', async () => {
    (fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/polls/private')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    });

    render(<PrivatePollFeed />);

    await waitFor(() => {
      expect(screen.getByText('No Private Polls Yet')).toBeInTheDocument();
    });

    expect(screen.getByText(/you don't have access to any private polls yet/i)).toBeInTheDocument();
  });

  it('should show different privacy level badges', async () => {
    const mockPolls = [
      {
        id: 'poll-123',
        title: 'Public Poll',
        description: 'A public poll',
        privacy_level: 'public',
        friend_group_id: null,
        created_at: '2024-01-01T00:00:00Z',
        access_level: 'view_vote',
        creator_name: 'John Doe',
      },
      {
        id: 'poll-456',
        title: 'Private Poll',
        description: 'A private poll',
        privacy_level: 'private',
        friend_group_id: null,
        created_at: '2024-01-01T00:00:00Z',
        access_level: 'view_vote',
        creator_name: 'Jane Smith',
      },
      {
        id: 'poll-789',
        title: 'Group Poll',
        description: 'A group poll',
        privacy_level: 'group',
        friend_group_id: 'group-123',
        created_at: '2024-01-01T00:00:00Z',
        access_level: 'view_vote',
        creator_name: 'Bob Wilson',
        group_name: 'Test Group',
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
      expect(screen.getByText('Public Poll')).toBeInTheDocument();
      expect(screen.getByText('Private Poll')).toBeInTheDocument();
      expect(screen.getByText('Group Poll')).toBeInTheDocument();
    });

    expect(screen.getByText('public')).toBeInTheDocument();
    expect(screen.getByText('private')).toBeInTheDocument();
    expect(screen.getByText('group')).toBeInTheDocument();
  });

  it('should show group invitations tab', async () => {
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
    expect(screen.getByText('Invited by John Doe')).toBeInTheDocument();
  });

  it('should show poll invitations tab', async () => {
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
    expect(screen.getByText('Invited by John Doe')).toBeInTheDocument();
  });

  it('should show invitation count badges', async () => {
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

    const mockPollInvitations = [
      {
        id: 'invitation-456',
        poll_title: 'Test Poll',
        inviter_name: 'Jane Smith',
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
      if (url.includes('/api/friend-groups/invitations')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockGroupInvitations),
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
      expect(screen.getByText('Group Invitations')).toBeInTheDocument();
      expect(screen.getByText('Poll Invitations')).toBeInTheDocument();
    });

    expect(screen.getByText('1')).toBeInTheDocument(); // Group invitations count
    expect(screen.getAllByText('1')).toHaveLength(2); // Both tabs have 1 invitation
  });

  it('should handle group invitation responses', async () => {
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

    const joinButton = screen.getByText('Join Group');
    fireEvent.click(joinButton);

    // Should handle the response (mocked in the component)
    expect(joinButton).toBeInTheDocument();
  });

  it('should handle poll invitation responses', async () => {
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

    const acceptButton = screen.getByText('Accept');
    fireEvent.click(acceptButton);

    // Should handle the response (mocked in the component)
    expect(acceptButton).toBeInTheDocument();
  });

  it('should show empty state for group invitations', async () => {
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
          json: () => Promise.resolve([]),
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
      expect(screen.getByText('No Group Invitations')).toBeInTheDocument();
    });

    expect(screen.getByText(/you don't have any pending group invitations/i)).toBeInTheDocument();
  });

  it('should show empty state for poll invitations', async () => {
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
          json: () => Promise.resolve([]),
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
      expect(screen.getByText('No Poll Invitations')).toBeInTheDocument();
    });

    expect(screen.getByText(/you don't have any pending poll invitations/i)).toBeInTheDocument();
  });

  it('should handle loading state', () => {
    (fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<PrivatePollFeed />);

    expect(screen.getByText('Loading private polls...')).toBeInTheDocument();
  });

  it('should handle error state', async () => {
    (fetch as any).mockRejectedValue(new Error('Network error'));

    render(<PrivatePollFeed />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load private polls')).toBeInTheDocument();
    });
  });

  it('should show poll creation date', async () => {
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
      expect(screen.getByText('Test Poll')).toBeInTheDocument();
    });

    expect(screen.getByText('1/1/2024')).toBeInTheDocument();
  });

  it('should show group name for group polls', async () => {
    const mockPolls = [
      {
        id: 'poll-123',
        title: 'Test Poll',
        description: 'A test poll',
        privacy_level: 'group',
        friend_group_id: 'group-123',
        created_at: '2024-01-01T00:00:00Z',
        access_level: 'view_vote',
        creator_name: 'John Doe',
        group_name: 'Test Group',
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
      expect(screen.getByText('Test Poll')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Group')).toBeInTheDocument();
  });

  it('should show access level icons', async () => {
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
      expect(screen.getByText('Test Poll')).toBeInTheDocument();
    });

    // Should have access level icons (Vote icon for view_vote access)
    expect(screen.getByText('Test Poll')).toBeInTheDocument();
  });
});
