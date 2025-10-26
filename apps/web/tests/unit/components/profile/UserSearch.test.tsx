import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserSearch from '@/components/profile/UserSearch';

// Mock fetch
global.fetch = vi.fn();

describe('UserSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render user search interface', () => {
    render(<UserSearch />);

    expect(screen.getByText('Discover Users')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/search for users/i)
    ).toBeInTheDocument();
  });

  it('should search users when typing', async () => {
    const mockUsers = [
      {
        id: 'user-123',
        display_name: 'John Doe',
        bio: 'A test user',
        avatar_url: null,
        interests: ['technology'],
        privacy_level: 'public',
        last_active_at: '2024-01-01T00:00:00Z',
        polls_created: 5,
        followers_count: 10,
      },
    ];

    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'searchUsers'
    ).mockResolvedValue(mockUsers);
    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'isFollowing'
    ).mockResolvedValue(false);

    render(<UserSearch />);

    const searchInput = screen.getByPlaceholderText(/search for users/i);
    fireEvent.change(searchInput, { target: { value: 'john' } });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(screen.getByText('A test user')).toBeInTheDocument();
  });

  it('should show follow button for search results', async () => {
    const mockUsers = [
      {
        id: 'user-123',
        display_name: 'John Doe',
        bio: 'A test user',
        avatar_url: null,
        interests: ['technology'],
        privacy_level: 'public',
        last_active_at: '2024-01-01T00:00:00Z',
        polls_created: 5,
        followers_count: 10,
      },
    ];

    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'searchUsers'
    ).mockResolvedValue(mockUsers);
    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'isFollowing'
    ).mockResolvedValue(false);

    render(<UserSearch />);

    const searchInput = screen.getByPlaceholderText(/search for users/i);
    fireEvent.change(searchInput, { target: { value: 'john' } });

    await waitFor(() => {
      expect(screen.getByText('Follow')).toBeInTheDocument();
    });
  });

  it('should handle follow action in search results', async () => {
    const mockUsers = [
      {
        id: 'user-123',
        display_name: 'John Doe',
        bio: 'A test user',
        avatar_url: null,
        interests: ['technology'],
        privacy_level: 'public',
        last_active_at: '2024-01-01T00:00:00Z',
        polls_created: 5,
        followers_count: 10,
      },
    ];

    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'searchUsers'
    ).mockResolvedValue(mockUsers);
    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'isFollowing'
    ).mockResolvedValue(false);
    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'followUser'
    ).mockResolvedValue(true);

    render(<UserSearch />);

    const searchInput = screen.getByPlaceholderText(/search for users/i);
    fireEvent.change(searchInput, { target: { value: 'john' } });

    await waitFor(() => {
      expect(screen.getByText('Follow')).toBeInTheDocument();
    });

    const followButton = screen.getByText('Follow');
    fireEvent.click(followButton);

    expect(
      require('@/lib/services/profile').ProfileService.followUser
    ).toHaveBeenCalledWith('user-123');
  });

  it('should handle unfollow action in search results', async () => {
    const mockUsers = [
      {
        id: 'user-123',
        display_name: 'John Doe',
        bio: 'A test user',
        avatar_url: null,
        interests: ['technology'],
        privacy_level: 'public',
        last_active_at: '2024-01-01T00:00:00Z',
        polls_created: 5,
        followers_count: 10,
      },
    ];

    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'searchUsers'
    ).mockResolvedValue(mockUsers);
    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'isFollowing'
    ).mockResolvedValue(true);
    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'unfollowUser'
    ).mockResolvedValue(true);

    render(<UserSearch />);

    const searchInput = screen.getByPlaceholderText(/search for users/i);
    fireEvent.change(searchInput, { target: { value: 'john' } });

    await waitFor(() => {
      expect(screen.getByText('Unfollow')).toBeInTheDocument();
    });

    const unfollowButton = screen.getByText('Unfollow');
    fireEvent.click(unfollowButton);

    expect(
      require('@/lib/services/profile').ProfileService.unfollowUser
    ).toHaveBeenCalledWith('user-123');
  });

  it('should show empty state when no search results', async () => {
    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'searchUsers'
    ).mockResolvedValue([]);

    render(<UserSearch />);

    const searchInput = screen.getByPlaceholderText(/search for users/i);
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(screen.getByText('No Users Found')).toBeInTheDocument();
    });
  });

  it('should show interests in search results', async () => {
    const mockUsers = [
      {
        id: 'user-123',
        display_name: 'John Doe',
        bio: 'A test user',
        avatar_url: null,
        interests: ['technology', 'gaming', 'music'],
        privacy_level: 'public',
        last_active_at: '2024-01-01T00:00:00Z',
        polls_created: 5,
        followers_count: 10,
      },
    ];

    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'searchUsers'
    ).mockResolvedValue(mockUsers);
    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'isFollowing'
    ).mockResolvedValue(false);

    render(<UserSearch />);

    const searchInput = screen.getByPlaceholderText(/search for users/i);
    fireEvent.change(searchInput, { target: { value: 'john' } });

    await waitFor(() => {
      expect(screen.getByText('technology')).toBeInTheDocument();
      expect(screen.getByText('gaming')).toBeInTheDocument();
      expect(screen.getByText('+1 more')).toBeInTheDocument();
    });
  });

  it('should show privacy level badges in search results', async () => {
    const mockUsers = [
      {
        id: 'user-123',
        display_name: 'John Doe',
        bio: 'A test user',
        avatar_url: null,
        interests: ['technology'],
        privacy_level: 'private',
        last_active_at: '2024-01-01T00:00:00Z',
        polls_created: 5,
        followers_count: 10,
      },
    ];

    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'searchUsers'
    ).mockResolvedValue(mockUsers);
    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'isFollowing'
    ).mockResolvedValue(false);

    render(<UserSearch />);

    const searchInput = screen.getByPlaceholderText(/search for users/i);
    fireEvent.change(searchInput, { target: { value: 'john' } });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Should show privacy level badge
    expect(screen.getByText('Private')).toBeInTheDocument();
  });

  it('should show user statistics in search results', async () => {
    const mockUsers = [
      {
        id: 'user-123',
        display_name: 'John Doe',
        bio: 'A test user',
        avatar_url: null,
        interests: ['technology'],
        privacy_level: 'public',
        last_active_at: '2024-01-01T00:00:00Z',
        polls_created: 5,
        followers_count: 10,
      },
    ];

    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'searchUsers'
    ).mockResolvedValue(mockUsers);
    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'isFollowing'
    ).mockResolvedValue(false);

    render(<UserSearch />);

    const searchInput = screen.getByPlaceholderText(/search for users/i);
    fireEvent.change(searchInput, { target: { value: 'john' } });

    await waitFor(() => {
      expect(screen.getByText('5 polls')).toBeInTheDocument();
      expect(screen.getByText('10 followers')).toBeInTheDocument();
    });
  });

  it('should show loading state during search', async () => {
    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'searchUsers'
    ).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<UserSearch />);

    const searchInput = screen.getByPlaceholderText(/search for users/i);
    fireEvent.change(searchInput, { target: { value: 'john' } });

    expect(screen.getByText('Searching users...')).toBeInTheDocument();
  });

  it('should show error state on search failure', async () => {
    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'searchUsers'
    ).mockRejectedValue(new Error('Search failed'));

    render(<UserSearch />);

    const searchInput = screen.getByPlaceholderText(/search for users/i);
    fireEvent.change(searchInput, { target: { value: 'john' } });

    await waitFor(() => {
      expect(screen.getByText('Failed to search users')).toBeInTheDocument();
    });
  });

  it('should show empty state when search term is too short', () => {
    render(<UserSearch />);

    const searchInput = screen.getByPlaceholderText(/search for users/i);
    fireEvent.change(searchInput, { target: { value: 'j' } });

    expect(screen.getByText('Search for Users')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Enter a name, bio, or interest to discover other users on the platform.'
      )
    ).toBeInTheDocument();
  });

  it('should handle user selection callback', async () => {
    const mockUsers = [
      {
        id: 'user-123',
        display_name: 'John Doe',
        bio: 'A test user',
        avatar_url: null,
        interests: ['technology'],
        privacy_level: 'public',
        last_active_at: '2024-01-01T00:00:00Z',
        polls_created: 5,
        followers_count: 10,
      },
    ];

    const mockOnUserSelect = vi.fn();

    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'searchUsers'
    ).mockResolvedValue(mockUsers);
    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'isFollowing'
    ).mockResolvedValue(false);

    render(<UserSearch onUserSelect={mockOnUserSelect} />);

    const searchInput = screen.getByPlaceholderText(/search for users/i);
    fireEvent.change(searchInput, { target: { value: 'john' } });

    await waitFor(() => {
      expect(screen.getByText('View Profile')).toBeInTheDocument();
    });

    const viewProfileButton = screen.getByText('View Profile');
    fireEvent.click(viewProfileButton);

    expect(mockOnUserSelect).toHaveBeenCalledWith(mockUsers[0]);
  });

  it('should show search result count', async () => {
    const mockUsers = [
      {
        id: 'user-123',
        display_name: 'John Doe',
        bio: 'A test user',
        avatar_url: null,
        interests: ['technology'],
        privacy_level: 'public',
        last_active_at: '2024-01-01T00:00:00Z',
        polls_created: 5,
        followers_count: 10,
      },
      {
        id: 'user-456',
        display_name: 'Jane Smith',
        bio: 'Another test user',
        avatar_url: null,
        interests: ['gaming'],
        privacy_level: 'public',
        last_active_at: '2024-01-01T00:00:00Z',
        polls_created: 3,
        followers_count: 5,
      },
    ];

    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'searchUsers'
    ).mockResolvedValue(mockUsers);
    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'isFollowing'
    ).mockResolvedValue(false);

    render(<UserSearch />);

    const searchInput = screen.getByPlaceholderText(/search for users/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(screen.getByText('Found 2 users')).toBeInTheDocument();
    });
  });

  it('should handle missing display name in search results', async () => {
    const mockUsers = [
      {
        id: 'user-123',
        display_name: null,
        bio: 'A test user',
        avatar_url: null,
        interests: ['technology'],
        privacy_level: 'public',
        last_active_at: '2024-01-01T00:00:00Z',
        polls_created: 5,
        followers_count: 10,
      },
    ];

    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'searchUsers'
    ).mockResolvedValue(mockUsers);
    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'isFollowing'
    ).mockResolvedValue(false);

    render(<UserSearch />);

    const searchInput = screen.getByPlaceholderText(/search for users/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(screen.getByText('Anonymous User')).toBeInTheDocument();
    });
  });

  it('should show last active date in search results', async () => {
    const mockUsers = [
      {
        id: 'user-123',
        display_name: 'John Doe',
        bio: 'A test user',
        avatar_url: null,
        interests: ['technology'],
        privacy_level: 'public',
        last_active_at: '2024-01-15T00:00:00Z',
        polls_created: 5,
        followers_count: 10,
      },
    ];

    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'searchUsers'
    ).mockResolvedValue(mockUsers);
    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'isFollowing'
    ).mockResolvedValue(false);

    render(<UserSearch />);

    const searchInput = screen.getByPlaceholderText(/search for users/i);
    fireEvent.change(searchInput, { target: { value: 'john' } });

    await waitFor(() => {
      expect(screen.getByText('Active Jan 15')).toBeInTheDocument();
    });
  });
});
