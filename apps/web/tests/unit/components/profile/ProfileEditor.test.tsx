import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfileEditor from '@/components/profile/ProfileEditor';

// Mock fetch
global.fetch = vi.fn();

describe('ProfileEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'getCurrentUserProfile'
    ).mockResolvedValue(mockProfile);

    render(<ProfileEditor />);

    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('A test user')).toBeInTheDocument();
  });

  it('should handle form input changes', async () => {
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

    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'getCurrentUserProfile'
    ).mockResolvedValue(mockProfile);

    render(<ProfileEditor />);

    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });

    const displayNameInput = screen.getByDisplayValue('John Doe');
    fireEvent.change(displayNameInput, { target: { value: 'Updated Name' } });

    expect(displayNameInput).toHaveValue('Updated Name');
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

    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'getCurrentUserProfile'
    ).mockResolvedValue(mockProfile);
    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'updateProfile'
    ).mockResolvedValue(true);

    render(<ProfileEditor />);

    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });

    const displayNameInput = screen.getByDisplayValue('John Doe');
    fireEvent.change(displayNameInput, { target: { value: 'Updated Name' } });

    const submitButton = screen.getByText('Save Changes');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        require('@/lib/services/profile').ProfileService.updateProfile
      ).toHaveBeenCalled();
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

    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'getCurrentUserProfile'
    ).mockResolvedValue(mockProfile);

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

  it('should handle interest input with Enter key', async () => {
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

    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'getCurrentUserProfile'
    ).mockResolvedValue(mockProfile);

    render(<ProfileEditor />);

    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });

    const interestInput = screen.getByPlaceholderText('Add an interest...');
    fireEvent.change(interestInput, { target: { value: 'technology' } });
    fireEvent.keyPress(interestInput, { key: 'Enter' });

    expect(screen.getByText('technology')).toBeInTheDocument();
  });

  it('should not add duplicate interests', async () => {
    const mockProfile = {
      id: 'user-123',
      email: 'user@example.com',
      display_name: 'John Doe',
      bio: 'A test user',
      avatar_url: null,
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

    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'getCurrentUserProfile'
    ).mockResolvedValue(mockProfile);

    render(<ProfileEditor />);

    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });

    const interestInput = screen.getByPlaceholderText('Add an interest...');
    fireEvent.change(interestInput, { target: { value: 'technology' } });

    const addButton = screen.getByText('Add');
    fireEvent.click(addButton);

    // Should still only have one instance
    const technologyBadges = screen.getAllByText('technology');
    expect(technologyBadges).toHaveLength(1);
  });

  it('should handle avatar file selection', async () => {
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

    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'getCurrentUserProfile'
    ).mockResolvedValue(mockProfile);

    render(<ProfileEditor />);

    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });

    const fileInput = screen.getByLabelText(/change avatar/i);
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(fileInput.files[0]).toBe(file);
  });

  it('should show character count for bio field', async () => {
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

    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'getCurrentUserProfile'
    ).mockResolvedValue(mockProfile);

    render(<ProfileEditor />);

    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });

    const bioInput = screen.getByDisplayValue('A test user');
    fireEvent.change(bioInput, { target: { value: 'Updated bio text' } });

    expect(screen.getByText('17/500 characters')).toBeInTheDocument();
  });

  it('should show character count for display name', async () => {
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

    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'getCurrentUserProfile'
    ).mockResolvedValue(mockProfile);

    render(<ProfileEditor />);

    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });

    const displayNameInput = screen.getByDisplayValue('John Doe');
    fireEvent.change(displayNameInput, { target: { value: 'Updated Name' } });

    expect(screen.getByText('12/50 characters')).toBeInTheDocument();
  });

  it('should handle privacy level selection', async () => {
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

    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'getCurrentUserProfile'
    ).mockResolvedValue(mockProfile);

    render(<ProfileEditor />);

    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });

    const privacySelect = screen.getByDisplayValue('Public');
    fireEvent.click(privacySelect);

    expect(screen.getByText('Friends Only')).toBeInTheDocument();
    expect(screen.getByText('Private')).toBeInTheDocument();
  });

  it('should show success message after successful update', async () => {
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

    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'getCurrentUserProfile'
    ).mockResolvedValue(mockProfile);
    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'updateProfile'
    ).mockResolvedValue(true);

    render(<ProfileEditor />);

    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });

    const submitButton = screen.getByText('Save Changes');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Profile updated successfully!')
      ).toBeInTheDocument();
    });
  });

  it('should show error message on update failure', async () => {
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

    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'getCurrentUserProfile'
    ).mockResolvedValue(mockProfile);
    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'updateProfile'
    ).mockResolvedValue(false);

    render(<ProfileEditor />);

    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });

    const submitButton = screen.getByText('Save Changes');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to update profile')).toBeInTheDocument();
    });
  });

  it('should show loading state', () => {
    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'getCurrentUserProfile'
    ).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<ProfileEditor />);

    expect(screen.getByText('Loading profile...')).toBeInTheDocument();
  });

  it('should show error state when profile not found', async () => {
    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'getCurrentUserProfile'
    ).mockResolvedValue(null);

    render(<ProfileEditor />);

    await waitFor(() => {
      expect(screen.getByText('Profile not found')).toBeInTheDocument();
    });
  });

  it('should handle cancel action', async () => {
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

    const mockOnCancel = vi.fn();

    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'getCurrentUserProfile'
    ).mockResolvedValue(mockProfile);

    render(<ProfileEditor onCancel={mockOnCancel} />);

    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should handle save callback', async () => {
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

    const mockOnSave = vi.fn();

    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'getCurrentUserProfile'
    ).mockResolvedValue(mockProfile);
    vi.spyOn(
      require('@/lib/services/profile').ProfileService,
      'updateProfile'
    ).mockResolvedValue(true);

    render(<ProfileEditor onSave={mockOnSave} />);

    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });

    const submitButton = screen.getByText('Save Changes');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
    });
  });
});
