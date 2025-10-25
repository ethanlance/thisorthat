import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserProfile from '@/components/profile/UserProfile';

// Mock fetch
global.fetch = vi.fn();

describe('UserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render user profile with basic information', async () => {
    const mockProfile = {
      id: 'user-123',
      email: 'user@example.com',
      display_name: 'John Doe',
      bio: 'A test user',
      avatar_url: 'https://example.com/avatar.jpg',
      interests: ['technology', 'gaming'],
      privacy_level: 'public',
      profile_completed: true,
      last_active_at: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
      polls_created: 5,
      polls_voted: 20,
      followers_count: 10,
      following_count: 15,
    };

    vi.spyOn(require('@/lib/services/profile').ProfileService, 'getUserProfile').mockResolvedValue(mockProfile);
    vi.spyOn(require('@/lib/services/profile').ProfileService, 'isFollowing').mockResolvedValue(false);

    render(<UserProfile userId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(screen.getByText('A test user')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // Polls created
    expect(screen.getByText('20')).toBeInTheDocument(); // Votes cast
    expect(screen.getByText('10')).toBeInTheDocument(); // Followers
    expect(screen.getByText('15')).toBeInTheDocument(); // Following
  });

  it('should show privacy level badge', async () => {
    const mockProfile = {
      id: 'user-123',
      email: 'user@example.com',
      display_name: 'John Doe',
      bio: 'A test user',
      avatar_url: null,
      interests: null,
      privacy_level: 'private',
      profile_completed: true,
      last_active_at: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
      polls_created: 5,
      polls_voted: 20,
      followers_count: 10,
      following_count: 15,
    };

    vi.spyOn(require('@/lib/services/profile').ProfileService, 'getUserProfile').mockResolvedValue(mockProfile);
    vi.spyOn(require('@/lib/services/profile').ProfileService, 'isFollowing').mockResolvedValue(false);

    render(<UserProfile userId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText('Private')).toBeInTheDocument();
    });
  });

  it('should show interests when available', async () => {
    const mockProfile = {
      id: 'user-123',
      email: 'user@example.com',
      display_name: 'John Doe',
      bio: 'A test user',
      avatar_url: null,
      interests: ['technology', 'gaming'],
      privacy_level: 'public',
      profile_completed: true,
      last_active_at: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
      polls_created: 5,
      polls_voted: 20,
      followers_count: 10,
      following_count: 15,
    };

    vi.spyOn(require('@/lib/services/profile').ProfileService, 'getUserProfile').mockResolvedValue(mockProfile);
    vi.spyOn(require('@/lib/services/profile').ProfileService, 'isFollowing').mockResolvedValue(false);

    render(<UserProfile userId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText('technology')).toBeInTheDocument();
      expect(screen.getByText('gaming')).toBeInTheDocument();
    });
  });

  it('should show follow button for other users', async () => {
    const mockProfile = {
      id: 'user-123',
      email: 'user@example.com',
      display_name: 'John Doe',
      bio: 'A test user',
      avatar_url: null,
      interests: null,
      privacy_level: 'public',
      profile_completed: true,
      last_active_at: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
      polls_created: 5,
      polls_voted: 20,
      followers_count: 10,
      following_count: 15,
    };

    vi.spyOn(require('@/lib/services/profile').ProfileService, 'getUserProfile').mockResolvedValue(mockProfile);
    vi.spyOn(require('@/lib/services/profile').ProfileService, 'isFollowing').mockResolvedValue(false);

    render(<UserProfile userId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText('Follow')).toBeInTheDocument();
    });
  });

  it('should handle follow action', async () => {
    const mockProfile = {
      id: 'user-123',
      email: 'user@example.com',
      display_name: 'John Doe',
      bio: 'A test user',
      avatar_url: null,
      interests: null,
      privacy_level: 'public',
      profile_completed: true,
      last_active_at: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
      polls_created: 5,
      polls_voted: 20,
      followers_count: 10,
      following_count: 15,
    };

    vi.spyOn(require('@/lib/services/profile').ProfileService, 'getUserProfile').mockResolvedValue(mockProfile);
    vi.spyOn(require('@/lib/services/profile').ProfileService, 'isFollowing').mockResolvedValue(false);
    vi.spyOn(require('@/lib/services/profile').ProfileService, 'followUser').mockResolvedValue(true);

    render(<UserProfile userId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText('Follow')).toBeInTheDocument();
    });

    const followButton = screen.getByText('Follow');
    fireEvent.click(followButton);

    expect(require('@/lib/services/profile').ProfileService.followUser).toHaveBeenCalledWith('user-123');
  });

  it('should handle unfollow action', async () => {
    const mockProfile = {
      id: 'user-123',
      email: 'user@example.com',
      display_name: 'John Doe',
      bio: 'A test user',
      avatar_url: null,
      interests: null,
      privacy_level: 'public',
      profile_completed: true,
      last_active_at: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
      polls_created: 5,
      polls_voted: 20,
      followers_count: 10,
      following_count: 15,
    };

    vi.spyOn(require('@/lib/services/profile').ProfileService, 'getUserProfile').mockResolvedValue(mockProfile);
    vi.spyOn(require('@/lib/services/profile').ProfileService, 'isFollowing').mockResolvedValue(true);
    vi.spyOn(require('@/lib/services/profile').ProfileService, 'unfollowUser').mockResolvedValue(true);

    render(<UserProfile userId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText('Unfollow')).toBeInTheDocument();
    });

    const unfollowButton = screen.getByText('Unfollow');
    fireEvent.click(unfollowButton);

    expect(require('@/lib/services/profile').ProfileService.unfollowUser).toHaveBeenCalledWith('user-123');
  });

  it('should show loading state', () => {
    vi.spyOn(require('@/lib/services/profile').ProfileService, 'getUserProfile').mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<UserProfile userId="user-123" />);

    expect(screen.getByText('Loading profile...')).toBeInTheDocument();
  });

  it('should show error state', async () => {
    vi.spyOn(require('@/lib/services/profile').ProfileService, 'getUserProfile').mockRejectedValue(new Error('Profile not found'));

    render(<UserProfile userId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load profile')).toBeInTheDocument();
    });
  });

  it('should show profile not found error', async () => {
    vi.spyOn(require('@/lib/services/profile').ProfileService, 'getUserProfile').mockResolvedValue(null);

    render(<UserProfile userId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText('Profile not found')).toBeInTheDocument();
    });
  });

  it('should display profile statistics correctly', async () => {
    const mockProfile = {
      id: 'user-123',
      email: 'user@example.com',
      display_name: 'John Doe',
      bio: 'A test user',
      avatar_url: null,
      interests: null,
      privacy_level: 'public',
      profile_completed: true,
      last_active_at: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
      polls_created: 5,
      polls_voted: 20,
      followers_count: 10,
      following_count: 15,
    };

    vi.spyOn(require('@/lib/services/profile').ProfileService, 'getUserProfile').mockResolvedValue(mockProfile);
    vi.spyOn(require('@/lib/services/profile').ProfileService, 'isFollowing').mockResolvedValue(false);

    render(<UserProfile userId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(screen.getByText('5')).toBeInTheDocument(); // Polls created
    expect(screen.getByText('20')).toBeInTheDocument(); // Votes cast
    expect(screen.getByText('10')).toBeInTheDocument(); // Followers
    expect(screen.getByText('15')).toBeInTheDocument(); // Following
  });

  it('should show profile completion status', async () => {
    const mockProfile = {
      id: 'user-123',
      email: 'user@example.com',
      display_name: 'John Doe',
      bio: 'A test user',
      avatar_url: null,
      interests: null,
      privacy_level: 'public',
      profile_completed: false,
      last_active_at: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
      polls_created: 5,
      polls_voted: 20,
      followers_count: 10,
      following_count: 15,
    };

    vi.spyOn(require('@/lib/services/profile').ProfileService, 'getUserProfile').mockResolvedValue(mockProfile);
    vi.spyOn(require('@/lib/services/profile').ProfileService, 'isFollowing').mockResolvedValue(false);

    render(<UserProfile userId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText('Incomplete')).toBeInTheDocument();
    });
  });

  it('should show different privacy level badges', async () => {
    const testCases = [
      { level: 'public', expectedText: 'Public' },
      { level: 'friends', expectedText: 'Friends Only' },
      { level: 'private', expectedText: 'Private' },
    ];

    for (const testCase of testCases) {
      const mockProfile = {
        id: 'user-123',
        email: 'user@example.com',
        display_name: 'John Doe',
        bio: 'A test user',
        avatar_url: null,
        interests: null,
        privacy_level: testCase.level,
        profile_completed: true,
        last_active_at: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        polls_created: 5,
        polls_voted: 20,
        followers_count: 10,
        following_count: 15,
      };

      vi.spyOn(require('@/lib/services/profile').ProfileService, 'getUserProfile').mockResolvedValue(mockProfile);
      vi.spyOn(require('@/lib/services/profile').ProfileService, 'isFollowing').mockResolvedValue(false);

      const { unmount } = render(<UserProfile userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText(testCase.expectedText)).toBeInTheDocument();
      });

      unmount();
    }
  });

  it('should handle missing display name', async () => {
    const mockProfile = {
      id: 'user-123',
      email: 'user@example.com',
      display_name: null,
      bio: 'A test user',
      avatar_url: null,
      interests: null,
      privacy_level: 'public',
      profile_completed: true,
      last_active_at: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
      polls_created: 5,
      polls_voted: 20,
      followers_count: 10,
      following_count: 15,
    };

    vi.spyOn(require('@/lib/services/profile').ProfileService, 'getUserProfile').mockResolvedValue(mockProfile);
    vi.spyOn(require('@/lib/services/profile').ProfileService, 'isFollowing').mockResolvedValue(false);

    render(<UserProfile userId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText('Anonymous User')).toBeInTheDocument();
    });
  });

  it('should show achievements section', async () => {
    const mockProfile = {
      id: 'user-123',
      email: 'user@example.com',
      display_name: 'John Doe',
      bio: 'A test user',
      avatar_url: null,
      interests: null,
      privacy_level: 'public',
      profile_completed: true,
      last_active_at: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
      polls_created: 5,
      polls_voted: 20,
      followers_count: 10,
      following_count: 15,
    };

    vi.spyOn(require('@/lib/services/profile').ProfileService, 'getUserProfile').mockResolvedValue(mockProfile);
    vi.spyOn(require('@/lib/services/profile').ProfileService, 'isFollowing').mockResolvedValue(false);

    render(<UserProfile userId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText('Achievements')).toBeInTheDocument();
    });

    expect(screen.getByText('No achievements yet')).toBeInTheDocument();
  });
});
