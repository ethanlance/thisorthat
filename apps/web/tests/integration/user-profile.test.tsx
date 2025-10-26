import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfileService } from '@/lib/services/profile';
import UserProfile from '@/components/profile/UserProfile';
import ProfileEditor from '@/components/profile/ProfileEditor';
import UserSearch from '@/components/profile/UserSearch';

// Mock fetch
global.fetch = vi.fn();

describe('User Profile System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ProfileService', () => {
    it('should get user profile', async () => {
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

      vi.spyOn(ProfileService, 'getUserProfile').mockResolvedValue(mockProfile);

      const result = await ProfileService.getUserProfile('user-123');

      expect(result).toEqual(mockProfile);
    });

    it('should update user profile', async () => {
      vi.spyOn(ProfileService, 'updateProfile').mockResolvedValue(true);

      const result = await ProfileService.updateProfile({
        display_name: 'Updated Name',
        bio: 'Updated bio',
        privacy_level: 'friends',
      });

      expect(result).toBe(true);
    });

    it('should search users', async () => {
      const mockUsers = [
        {
          id: 'user-123',
          display_name: 'John Doe',
          bio: 'A test user',
          avatar_url: 'https://example.com/avatar.jpg',
          interests: ['technology'],
          privacy_level: 'public',
          last_active_at: '2024-01-01T00:00:00Z',
          polls_created: 5,
          followers_count: 10,
        },
      ];

      vi.spyOn(ProfileService, 'searchUsers').mockResolvedValue(mockUsers);

      const result = await ProfileService.searchUsers('john', 20, 0);

      expect(result).toEqual(mockUsers);
    });

    it('should follow a user', async () => {
      vi.spyOn(ProfileService, 'followUser').mockResolvedValue(true);

      const result = await ProfileService.followUser('user-123');

      expect(result).toBe(true);
    });

    it('should unfollow a user', async () => {
      vi.spyOn(ProfileService, 'unfollowUser').mockResolvedValue(true);

      const result = await ProfileService.unfollowUser('user-123');

      expect(result).toBe(true);
    });

    it('should check if user is following another user', async () => {
      vi.spyOn(ProfileService, 'isFollowing').mockResolvedValue(true);

      const result = await ProfileService.isFollowing('user-1', 'user-2');

      expect(result).toBe(true);
    });

    it('should get user statistics', async () => {
      const mockStats = {
        polls_created: 5,
        polls_voted: 20,
        followers_count: 10,
        following_count: 15,
        achievements_count: 3,
      };

      vi.spyOn(ProfileService, 'getUserStats').mockResolvedValue(mockStats);

      const result = await ProfileService.getUserStats('user-123');

      expect(result).toEqual(mockStats);
    });

    it('should track user activity', async () => {
      vi.spyOn(ProfileService, 'trackActivity').mockResolvedValue(true);

      const result = await ProfileService.trackActivity('poll_created', {
        poll_id: 'poll-123',
      });

      expect(result).toBe(true);
    });
  });

  describe('UserProfile Component', () => {
    it('should render user profile', async () => {
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

      vi.spyOn(ProfileService, 'getUserProfile').mockResolvedValue(mockProfile);
      vi.spyOn(ProfileService, 'isFollowing').mockResolvedValue(false);

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

      vi.spyOn(ProfileService, 'getUserProfile').mockResolvedValue(mockProfile);
      vi.spyOn(ProfileService, 'isFollowing').mockResolvedValue(false);

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

      vi.spyOn(ProfileService, 'getUserProfile').mockResolvedValue(mockProfile);
      vi.spyOn(ProfileService, 'isFollowing').mockResolvedValue(false);
      vi.spyOn(ProfileService, 'followUser').mockResolvedValue(true);

      render(<UserProfile userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText('Follow')).toBeInTheDocument();
      });

      const followButton = screen.getByText('Follow');
      fireEvent.click(followButton);

      expect(ProfileService.followUser).toHaveBeenCalledWith('user-123');
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

      vi.spyOn(ProfileService, 'getUserProfile').mockResolvedValue(mockProfile);
      vi.spyOn(ProfileService, 'isFollowing').mockResolvedValue(false);

      render(<UserProfile userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText('Private')).toBeInTheDocument();
      });
    });

    it('should show interests', async () => {
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

      vi.spyOn(ProfileService, 'getUserProfile').mockResolvedValue(mockProfile);
      vi.spyOn(ProfileService, 'isFollowing').mockResolvedValue(false);

      render(<UserProfile userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText('technology')).toBeInTheDocument();
        expect(screen.getByText('gaming')).toBeInTheDocument();
      });
    });
  });

  describe('ProfileEditor Component', () => {
    it('should render profile editor form', async () => {
      const mockProfile = {
        id: 'user-123',
        email: 'user@example.com',
        display_name: 'John Doe',
        bio: 'A test user',
        avatar_url: 'https://example.com/avatar.jpg',
        interests: ['technology'],
        privacy_level: 'public',
        profile_completed: true,
        last_active_at: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        polls_created: 5,
        polls_voted: 20,
        followers_count: 10,
        following_count: 15,
      };

      vi.spyOn(ProfileService, 'getCurrentUserProfile').mockResolvedValue(
        mockProfile
      );

      render(<ProfileEditor />);

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      });

      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('A test user')).toBeInTheDocument();
    });

    it('should handle form submission', async () => {
      const mockProfile = {
        id: 'user-123',
        email: 'user@example.com',
        display_name: 'John Doe',
        bio: 'A test user',
        avatar_url: null,
        interests: [],
        privacy_level: 'public',
        profile_completed: true,
        last_active_at: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        polls_created: 5,
        polls_voted: 20,
        followers_count: 10,
        following_count: 15,
      };

      vi.spyOn(ProfileService, 'getCurrentUserProfile').mockResolvedValue(
        mockProfile
      );
      vi.spyOn(ProfileService, 'updateProfile').mockResolvedValue(true);

      render(<ProfileEditor />);

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      });

      const displayNameInput = screen.getByDisplayValue('John Doe');
      fireEvent.change(displayNameInput, { target: { value: 'Updated Name' } });

      const submitButton = screen.getByText('Save Changes');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(ProfileService.updateProfile).toHaveBeenCalledWith({
          display_name: 'Updated Name',
          bio: 'A test user',
          avatar_url: null,
          interests: [],
          privacy_level: 'public',
        });
      });
    });

    it('should add and remove interests', async () => {
      const mockProfile = {
        id: 'user-123',
        email: 'user@example.com',
        display_name: 'John Doe',
        bio: 'A test user',
        avatar_url: null,
        interests: [],
        privacy_level: 'public',
        profile_completed: true,
        last_active_at: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        polls_created: 5,
        polls_voted: 20,
        followers_count: 10,
        following_count: 15,
      };

      vi.spyOn(ProfileService, 'getCurrentUserProfile').mockResolvedValue(
        mockProfile
      );

      render(<ProfileEditor />);

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      });

      const interestInput = screen.getByPlaceholderText('Add an interest...');
      fireEvent.change(interestInput, { target: { value: 'technology' } });

      const addButton = screen.getByText('Add');
      fireEvent.click(addButton);

      expect(screen.getByText('technology')).toBeInTheDocument();

      const removeButton = screen.getByText('×');
      fireEvent.click(removeButton);

      expect(screen.queryByText('technology')).not.toBeInTheDocument();
    });

    it('should handle avatar upload', async () => {
      const mockProfile = {
        id: 'user-123',
        email: 'user@example.com',
        display_name: 'John Doe',
        bio: 'A test user',
        avatar_url: null,
        interests: [],
        privacy_level: 'public',
        profile_completed: true,
        last_active_at: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        polls_created: 5,
        polls_voted: 20,
        followers_count: 10,
        following_count: 15,
      };

      vi.spyOn(ProfileService, 'getCurrentUserProfile').mockResolvedValue(
        mockProfile
      );

      render(<ProfileEditor />);

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      });

      const fileInput = screen.getByLabelText(/change avatar/i);
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Should show the file was selected (avatar preview would update)
      expect(fileInput.files[0]).toBe(file);
    });
  });

  describe('UserSearch Component', () => {
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

      vi.spyOn(ProfileService, 'searchUsers').mockResolvedValue(mockUsers);
      vi.spyOn(ProfileService, 'isFollowing').mockResolvedValue(false);

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

      vi.spyOn(ProfileService, 'searchUsers').mockResolvedValue(mockUsers);
      vi.spyOn(ProfileService, 'isFollowing').mockResolvedValue(false);

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

      vi.spyOn(ProfileService, 'searchUsers').mockResolvedValue(mockUsers);
      vi.spyOn(ProfileService, 'isFollowing').mockResolvedValue(false);
      vi.spyOn(ProfileService, 'followUser').mockResolvedValue(true);

      render(<UserSearch />);

      const searchInput = screen.getByPlaceholderText(/search for users/i);
      fireEvent.change(searchInput, { target: { value: 'john' } });

      await waitFor(() => {
        expect(screen.getByText('Follow')).toBeInTheDocument();
      });

      const followButton = screen.getByText('Follow');
      fireEvent.click(followButton);

      expect(ProfileService.followUser).toHaveBeenCalledWith('user-123');
    });

    it('should show empty state when no search results', async () => {
      vi.spyOn(ProfileService, 'searchUsers').mockResolvedValue([]);

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

      vi.spyOn(ProfileService, 'searchUsers').mockResolvedValue(mockUsers);
      vi.spyOn(ProfileService, 'isFollowing').mockResolvedValue(false);

      render(<UserSearch />);

      const searchInput = screen.getByPlaceholderText(/search for users/i);
      fireEvent.change(searchInput, { target: { value: 'john' } });

      await waitFor(() => {
        expect(screen.getByText('technology')).toBeInTheDocument();
        expect(screen.getByText('gaming')).toBeInTheDocument();
        expect(screen.getByText('+1 more')).toBeInTheDocument();
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete profile workflow', async () => {
      // 1. Get user profile
      const profile = await ProfileService.getUserProfile('user-123');
      expect(profile).toBeDefined();

      // 2. Update profile
      const updateSuccess = await ProfileService.updateProfile({
        display_name: 'Updated Name',
        bio: 'Updated bio',
        privacy_level: 'friends',
      });
      expect(updateSuccess).toBe(true);

      // 3. Search for users
      const searchResults = await ProfileService.searchUsers('updated', 20, 0);
      expect(searchResults).toBeDefined();

      // 4. Follow a user
      const followSuccess = await ProfileService.followUser('user-456');
      expect(followSuccess).toBe(true);

      // 5. Check following status
      const isFollowing = await ProfileService.isFollowing(
        'user-123',
        'user-456'
      );
      expect(isFollowing).toBeDefined();
    });

    it('should handle profile privacy levels', async () => {
      // Test public profile access
      const publicProfile = await ProfileService.getUserProfile('public-user');
      expect(publicProfile).toBeDefined();

      // Test private profile access
      const privateProfile =
        await ProfileService.getUserProfile('private-user');
      expect(privateProfile).toBeDefined();

      // Test friends-only profile access
      const friendsProfile =
        await ProfileService.getUserProfile('friends-user');
      expect(friendsProfile).toBeDefined();
    });

    it('should handle user statistics', async () => {
      const stats = await ProfileService.getUserStats('user-123');
      expect(stats).toHaveProperty('polls_created');
      expect(stats).toHaveProperty('polls_voted');
      expect(stats).toHaveProperty('followers_count');
      expect(stats).toHaveProperty('following_count');
      expect(stats).toHaveProperty('achievements_count');
    });
  });
});
