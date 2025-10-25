import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FriendGroupManager from '@/components/privacy/FriendGroupManager';

// Mock fetch
global.fetch = vi.fn();

describe('FriendGroupManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
    expect(screen.getByText('5 members')).toBeInTheDocument();
  });

  it('should show empty state when no groups', async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ groups: [] }),
    });

    render(<FriendGroupManager />);

    await waitFor(() => {
      expect(screen.getByText('No Friend Groups Yet')).toBeInTheDocument();
    });

    expect(screen.getByText('Create your first friend group to start sharing private polls')).toBeInTheDocument();
  });

  it('should create a new friend group', async () => {
    (fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/friend-groups') && url.includes('POST')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
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

    await waitFor(() => {
      expect(screen.getByText('Create Friend Group')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/group name/i);
    fireEvent.change(nameInput, { target: { value: 'New Group' } });

    const descriptionInput = screen.getByLabelText(/description/i);
    fireEvent.change(descriptionInput, { target: { value: 'A new group' } });

    const submitButton = screen.getByText('Create Group');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/friend-groups', expect.any(Object));
    });
  });

  it('should validate required fields when creating group', async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ groups: [] }),
    });

    render(<FriendGroupManager />);

    const createButton = screen.getByText('Create Group');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Create Friend Group')).toBeInTheDocument();
    });

    const submitButton = screen.getByText('Create Group');
    fireEvent.click(submitButton);

    // Should not make API call without required fields
    expect(fetch).not.toHaveBeenCalledWith('/api/friend-groups', expect.any(Object));
  });

  it('should show group privacy indicators', async () => {
    const mockGroups = [
      {
        id: 'group-123',
        name: 'Public Group',
        description: 'A public group',
        is_public: true,
        member_count: 5,
        created_at: '2024-01-01T00:00:00Z',
        created_by: 'user-123',
      },
      {
        id: 'group-456',
        name: 'Private Group',
        description: 'A private group',
        is_public: false,
        member_count: 3,
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
      expect(screen.getByText('Public Group')).toBeInTheDocument();
      expect(screen.getByText('Private Group')).toBeInTheDocument();
    });

    expect(screen.getByText('Public')).toBeInTheDocument();
    expect(screen.getByText('Private')).toBeInTheDocument();
  });

  it('should open group management dialog', async () => {
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

    const mockMembers = [
      {
        user_id: 'user-456',
        display_name: 'John Doe',
        email: 'john@example.com',
        role: 'member',
        joined_at: '2024-01-01T00:00:00Z',
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
          json: () => Promise.resolve({ members: mockMembers }),
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

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
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

    const emailInput = screen.getByPlaceholderText(/enter email address/i);
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

    const inviteButton = screen.getByText('Invite');
    fireEvent.click(inviteButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/friend-groups/group-123/invite', expect.any(Object));
    });
  });

  it('should handle group creation error', async () => {
    (fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/friend-groups') && url.includes('POST')) {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Failed to create group' }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ groups: [] }),
      });
    });

    render(<FriendGroupManager />);

    const createButton = screen.getByText('Create Group');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Create Friend Group')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/group name/i);
    fireEvent.change(nameInput, { target: { value: 'New Group' } });

    const submitButton = screen.getByText('Create Group');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to create group')).toBeInTheDocument();
    });
  });

  it('should handle loading state', () => {
    (fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<FriendGroupManager />);

    expect(screen.getByText('Loading friend groups...')).toBeInTheDocument();
  });

  it('should handle error state', async () => {
    (fetch as any).mockRejectedValue(new Error('Network error'));

    render(<FriendGroupManager />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load friend groups')).toBeInTheDocument();
    });
  });

  it('should show group creation date', async () => {
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
      expect(screen.getByText('Test Group')).toBeInTheDocument();
    });

    expect(screen.getByText('Created 1/1/2024')).toBeInTheDocument();
  });

  it('should show member count in group cards', async () => {
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
      expect(screen.getByText('5 members')).toBeInTheDocument();
    });
  });

  it('should close group management dialog', async () => {
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

    const doneButton = screen.getByText('Done');
    fireEvent.click(doneButton);

    expect(screen.queryByText('Manage Test Group')).not.toBeInTheDocument();
  });
});
