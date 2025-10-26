import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PollAccessManager from '@/components/privacy/PollAccessManager';

// Mock fetch
global.fetch = vi.fn();

describe('PollAccessManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('should show privacy level information', async () => {
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
      expect(screen.getByText('Privacy Level:')).toBeInTheDocument();
    });

    expect(screen.getByText('Private')).toBeInTheDocument();
    expect(
      screen.getByText(
        /this poll is private and only accessible to invited users/i
      )
    ).toBeInTheDocument();
  });

  it('should show invite button for private polls', async () => {
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
  });

  it('should not show invite button for public polls', async () => {
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
      return Promise.reject(new Error('Unknown URL'));
    });

    render(
      <PollAccessManager
        pollId="poll-123"
        pollTitle="Test Poll"
        privacyLevel="public"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Poll Access Management')).toBeInTheDocument();
    });

    expect(screen.queryByText('Invite User')).not.toBeInTheDocument();
  });

  it('should open invitation dialog', async () => {
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

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/access level/i)).toBeInTheDocument();
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

  it('should show pending invitations', async () => {
    const mockInvitations = [
      {
        id: 'invitation-123',
        invited_user_id: 'user-456',
        email: 'user@example.com',
        message: 'Check out this poll!',
        status: 'pending',
        created_at: '2024-01-01T00:00:00Z',
        responded_at: null,
      },
    ];

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
          json: () => Promise.resolve({ invitations: mockInvitations }),
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
      expect(screen.getByText('Pending Invitations (1)')).toBeInTheDocument();
    });

    expect(screen.getByText('user@example.com')).toBeInTheDocument();
    expect(screen.getByText('Check out this poll!')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
  });

  it('should show access levels with correct icons', async () => {
    const mockAccess = [
      {
        id: 'access-123',
        user_id: 'user-456',
        display_name: 'John Doe',
        email: 'john@example.com',
        access_level: 'view',
        shared_at: '2024-01-01T00:00:00Z',
        expires_at: null,
        is_active: true,
      },
      {
        id: 'access-456',
        user_id: 'user-789',
        display_name: 'Jane Smith',
        email: 'jane@example.com',
        access_level: 'admin',
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
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    expect(screen.getByText('view')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
  });

  it('should show expiration dates when set', async () => {
    const mockAccess = [
      {
        id: 'access-123',
        user_id: 'user-456',
        display_name: 'John Doe',
        email: 'john@example.com',
        access_level: 'view_vote',
        shared_at: '2024-01-01T00:00:00Z',
        expires_at: '2024-12-31T23:59:59Z',
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
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(screen.getByText(/expires 12\/31\/2024/i)).toBeInTheDocument();
  });

  it('should show empty state when no access', async () => {
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
      expect(
        screen.getByText('No users have access to this poll yet')
      ).toBeInTheDocument();
    });
  });

  it('should handle loading state', () => {
    (fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <PollAccessManager
        pollId="poll-123"
        pollTitle="Test Poll"
        privacyLevel="private"
      />
    );

    expect(screen.getByText('Loading poll access...')).toBeInTheDocument();
  });

  it('should handle error state', async () => {
    (fetch as any).mockRejectedValue(new Error('Network error'));

    render(
      <PollAccessManager
        pollId="poll-123"
        pollTitle="Test Poll"
        privacyLevel="private"
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load poll access information')
      ).toBeInTheDocument();
    });
  });

  it('should show different privacy level descriptions', async () => {
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
      return Promise.reject(new Error('Unknown URL'));
    });

    const { rerender } = render(
      <PollAccessManager
        pollId="poll-123"
        pollTitle="Test Poll"
        privacyLevel="public"
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText(/this poll is public and accessible to everyone/i)
      ).toBeInTheDocument();
    });

    rerender(
      <PollAccessManager
        pollId="poll-123"
        pollTitle="Test Poll"
        privacyLevel="group"
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          /this poll is accessible to all members of the associated friend group/i
        )
      ).toBeInTheDocument();
    });
  });

  it('should validate email when inviting', async () => {
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

    const submitButton = screen.getByText('Send Invitation');
    fireEvent.click(submitButton);

    // Should not make API call without email
    expect(fetch).not.toHaveBeenCalledWith(
      '/api/polls/poll-123/invite',
      expect.any(Object)
    );
  });

  it('should close invitation dialog on cancel', async () => {
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

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(screen.queryByText('Invite User to Poll')).not.toBeInTheDocument();
  });
});
