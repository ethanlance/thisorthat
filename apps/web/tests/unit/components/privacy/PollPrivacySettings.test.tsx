import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PollPrivacySettings from '@/components/privacy/PollPrivacySettings';

// Mock fetch
global.fetch = vi.fn();

describe('PollPrivacySettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it('should show public option as default', () => {
    const mockOnChange = vi.fn();

    render(
      <PollPrivacySettings
        onPrivacyChange={mockOnChange}
        initialSettings={{ privacy_level: 'public' }}
      />
    );

    const publicOption = screen.getByLabelText(/public/i);
    expect(publicOption).toBeChecked();
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

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        privacy_level: 'private',
      })
    );
  });

  it('should show friend group selection for group polls', () => {
    const mockOnChange = vi.fn();

    render(
      <PollPrivacySettings
        onPrivacyChange={mockOnChange}
        initialSettings={{ privacy_level: 'group' }}
      />
    );

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

    expect(screen.getByText('Invite Users')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/enter email or username/i)
    ).toBeInTheDocument();
  });

  it('should add and remove invited users', () => {
    const mockOnChange = vi.fn();

    render(
      <PollPrivacySettings
        onPrivacyChange={mockOnChange}
        initialSettings={{ privacy_level: 'private' }}
      />
    );

    const emailInput = screen.getByPlaceholderText(/enter email or username/i);
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

    const addButton = screen.getByRole('button', { name: /add/i });
    fireEvent.click(addButton);

    expect(screen.getByText('user@example.com')).toBeInTheDocument();

    const removeButton = screen.getByText('×');
    fireEvent.click(removeButton);

    expect(screen.queryByText('user@example.com')).not.toBeInTheDocument();
  });

  it('should handle key press for adding users', () => {
    const mockOnChange = vi.fn();

    render(
      <PollPrivacySettings
        onPrivacyChange={mockOnChange}
        initialSettings={{ privacy_level: 'private' }}
      />
    );

    const emailInput = screen.getByPlaceholderText(/enter email or username/i);
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.keyPress(emailInput, { key: 'Enter' });

    expect(screen.getByText('user@example.com')).toBeInTheDocument();
  });

  it('should not add duplicate users', () => {
    const mockOnChange = vi.fn();

    render(
      <PollPrivacySettings
        onPrivacyChange={mockOnChange}
        initialSettings={{ privacy_level: 'private' }}
      />
    );

    const emailInput = screen.getByPlaceholderText(/enter email or username/i);

    // Add user first time
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.keyPress(emailInput, { key: 'Enter' });

    expect(screen.getByText('user@example.com')).toBeInTheDocument();

    // Try to add same user again
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.keyPress(emailInput, { key: 'Enter' });

    // Should still only have one instance
    const userBadges = screen.getAllByText('user@example.com');
    expect(userBadges).toHaveLength(1);
  });

  it('should show custom message field for private polls', () => {
    const mockOnChange = vi.fn();

    render(
      <PollPrivacySettings
        onPrivacyChange={mockOnChange}
        initialSettings={{ privacy_level: 'private' }}
      />
    );

    expect(screen.getByText('Custom Message (Optional)')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/add a personal message/i)
    ).toBeInTheDocument();
  });

  it('should show access expiration field', () => {
    const mockOnChange = vi.fn();

    render(
      <PollPrivacySettings
        onPrivacyChange={mockOnChange}
        initialSettings={{ privacy_level: 'public' }}
      />
    );

    expect(screen.getByText('Access Expires (Optional)')).toBeInTheDocument();
    expect(screen.getByLabelText(/access expires/i)).toBeInTheDocument();
  });

  it('should show privacy preview', () => {
    const mockOnChange = vi.fn();

    render(
      <PollPrivacySettings
        onPrivacyChange={mockOnChange}
        initialSettings={{ privacy_level: 'public' }}
      />
    );

    expect(screen.getByText('Privacy Preview')).toBeInTheDocument();
    expect(
      screen.getByText(/this poll will be visible to everyone/i)
    ).toBeInTheDocument();
  });

  it('should update privacy preview when settings change', () => {
    const mockOnChange = vi.fn();

    render(
      <PollPrivacySettings
        onPrivacyChange={mockOnChange}
        initialSettings={{ privacy_level: 'public' }}
      />
    );

    const privateOption = screen.getByLabelText(/private/i);
    fireEvent.click(privateOption);

    expect(
      screen.getByText(/this poll will only be accessible to you/i)
    ).toBeInTheDocument();
  });

  it('should load friend groups for group selection', async () => {
    const mockGroups = [
      {
        id: 'group-123',
        name: 'Test Group',
        member_count: 5,
      },
    ];

    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ groups: mockGroups }),
    });

    const mockOnChange = vi.fn();

    render(
      <PollPrivacySettings
        onPrivacyChange={mockOnChange}
        initialSettings={{ privacy_level: 'group' }}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Group')).toBeInTheDocument();
    });
  });

  it('should show empty state when no friend groups', async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ groups: [] }),
    });

    const mockOnChange = vi.fn();

    render(
      <PollPrivacySettings
        onPrivacyChange={mockOnChange}
        initialSettings={{ privacy_level: 'group' }}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText(/you don't have any friend groups yet/i)
      ).toBeInTheDocument();
    });
  });

  it('should handle disabled state', () => {
    const mockOnChange = vi.fn();

    render(
      <PollPrivacySettings
        onPrivacyChange={mockOnChange}
        initialSettings={{ privacy_level: 'public' }}
        disabled={true}
      />
    );

    const publicOption = screen.getByLabelText(/public/i);
    expect(publicOption).toBeDisabled();
  });

  it('should show character count for custom message', () => {
    const mockOnChange = vi.fn();

    render(
      <PollPrivacySettings
        onPrivacyChange={mockOnChange}
        initialSettings={{ privacy_level: 'private' }}
      />
    );

    const messageInput = screen.getByPlaceholderText(/add a personal message/i);
    fireEvent.change(messageInput, { target: { value: 'Test message' } });

    expect(screen.getByText('12/500 characters')).toBeInTheDocument();
  });

  it('should show invited users count', () => {
    const mockOnChange = vi.fn();

    render(
      <PollPrivacySettings
        onPrivacyChange={mockOnChange}
        initialSettings={{ privacy_level: 'private' }}
      />
    );

    const emailInput = screen.getByPlaceholderText(/enter email or username/i);

    // Add two users
    fireEvent.change(emailInput, { target: { value: 'user1@example.com' } });
    fireEvent.keyPress(emailInput, { key: 'Enter' });

    fireEvent.change(emailInput, { target: { value: 'user2@example.com' } });
    fireEvent.keyPress(emailInput, { key: 'Enter' });

    expect(screen.getByText('Invited Users (2)')).toBeInTheDocument();
  });
});
