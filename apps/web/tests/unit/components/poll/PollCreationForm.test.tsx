import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import PollCreationForm from '@/components/poll/PollCreationForm';
import { useAuth } from '@/contexts/AuthContext';
import { PollsService } from '@/lib/services/polls';
import { uploadPollImage } from '@/lib/storage/image-upload';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/lib/services/polls', () => ({
  PollsService: {
    createPoll: vi.fn(),
    updatePollWithImages: vi.fn(),
  },
}));

vi.mock('@/lib/storage/image-upload', () => ({
  uploadPollImage: vi.fn(),
}));

vi.mock('@/components/upload/ImageUpload', () => ({
  default: ({ option, onImageSelect, onError, disabled }: any) => (
    <div data-testid={`image-upload-${option}`}>
      <button
        onClick={() =>
          onImageSelect(new File(['test'], 'test.jpg', { type: 'image/jpeg' }))
        }
        disabled={disabled}
      >
        Upload {option.toUpperCase()}
      </button>
      <button onClick={() => onError('Upload failed')}>Trigger Error</button>
    </div>
  ),
}));

describe('PollCreationForm', () => {
  const mockPush = vi.fn();
  const mockUser = { id: 'user-123', email: 'test@example.com' };
  const mockPoll = { id: 'poll-123' };

  beforeEach(() => {
    vi.clearAllMocks();

    (useRouter as any).mockReturnValue({
      push: mockPush,
    });

    (useAuth as any).mockReturnValue({
      user: mockUser,
    });

    (PollsService.createPoll as any).mockResolvedValue(mockPoll);
    (PollsService.updatePollWithImages as any).mockResolvedValue(mockPoll);
    (uploadPollImage as any).mockResolvedValue({
      success: true,
      url: 'https://example.com/image.jpg',
    });
  });

  it('renders the form with all required fields', () => {
    render(<PollCreationForm />);

    expect(screen.getByText('Create a Poll')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Upload two images and let your friends help you decide!'
      )
    ).toBeInTheDocument();
    expect(screen.getByTestId('image-upload-a')).toBeInTheDocument();
    expect(screen.getByTestId('image-upload-b')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Option A Label (optional)')
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Option B Label (optional)')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Description (optional)')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Create Poll' })
    ).toBeInTheDocument();
  });

  it('shows login prompt when user is not authenticated', () => {
    (useAuth as any).mockReturnValue({ user: null });

    render(<PollCreationForm />);

    expect(
      screen.getByText('You must be logged in to create a poll.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('validates required image fields', async () => {
    render(<PollCreationForm />);

    const submitButton = screen.getByRole('button', { name: 'Create Poll' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Option A image is required')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Option B image is required')
      ).toBeInTheDocument();
    });
  });

  it('submits form successfully with valid data', async () => {
    render(<PollCreationForm />);

    // Upload images
    fireEvent.click(screen.getByText('Upload A'));
    fireEvent.click(screen.getByText('Upload B'));

    // Fill form fields
    fireEvent.change(screen.getByLabelText('Option A Label (optional)'), {
      target: { value: 'Pizza' },
    });
    fireEvent.change(screen.getByLabelText('Option B Label (optional)'), {
      target: { value: 'Burger' },
    });
    fireEvent.change(screen.getByLabelText('Description (optional)'), {
      target: { value: 'What should I have for dinner?' },
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: 'Create Poll' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(PollsService.createPoll).toHaveBeenCalledWith({
        creatorId: 'user-123',
        optionALabel: 'Pizza',
        optionBLabel: 'Burger',
        description: 'What should I have for dinner?',
        isPublic: true,
      });
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/poll/poll-123');
    });
  });

  it('handles form submission errors', async () => {
    (PollsService.createPoll as any).mockRejectedValue(
      new Error('Database error')
    );

    render(<PollCreationForm />);

    // Upload images
    fireEvent.click(screen.getByText('Upload A'));
    fireEvent.click(screen.getByText('Upload B'));

    // Submit form
    const submitButton = screen.getByRole('button', { name: 'Create Poll' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Database error')).toBeInTheDocument();
    });
  });

  it('validates field length limits', async () => {
    render(<PollCreationForm />);

    // Test option A label length
    const optionALabel = screen.getByLabelText('Option A Label (optional)');
    fireEvent.change(optionALabel, {
      target: { value: 'A'.repeat(51) },
    });

    await waitFor(() => {
      expect(
        screen.getByText('Option A label must be 50 characters or less')
      ).toBeInTheDocument();
    });

    // Test option B label length
    const optionBLabel = screen.getByLabelText('Option B Label (optional)');
    fireEvent.change(optionBLabel, {
      target: { value: 'B'.repeat(51) },
    });

    await waitFor(() => {
      expect(
        screen.getByText('Option B label must be 50 characters or less')
      ).toBeInTheDocument();
    });

    // Test description length
    const description = screen.getByLabelText('Description (optional)');
    fireEvent.change(description, {
      target: { value: 'D'.repeat(501) },
    });

    await waitFor(() => {
      expect(
        screen.getByText('Description must be 500 characters or less')
      ).toBeInTheDocument();
    });
  });

  it('shows character count for text fields', () => {
    render(<PollCreationForm />);

    const optionALabel = screen.getByLabelText('Option A Label (optional)');
    fireEvent.change(optionALabel, { target: { value: 'Pizza' } });

    expect(screen.getByText('5/50 characters')).toBeInTheDocument();

    const description = screen.getByLabelText('Description (optional)');
    fireEvent.change(description, { target: { value: 'Test description' } });

    expect(screen.getByText('16/500 characters')).toBeInTheDocument();
  });

  it('disables form during submission', async () => {
    render(<PollCreationForm />);

    // Upload images
    fireEvent.click(screen.getByText('Upload A'));
    fireEvent.click(screen.getByText('Upload B'));

    // Submit form
    const submitButton = screen.getByRole('button', { name: 'Create Poll' });
    fireEvent.click(submitButton);

    // Check that form is disabled during submission
    expect(screen.getByText('Creating Poll...')).toBeInTheDocument();
    expect(screen.getByLabelText('Option A Label (optional)')).toBeDisabled();
    expect(screen.getByLabelText('Option B Label (optional)')).toBeDisabled();
    expect(screen.getByLabelText('Description (optional)')).toBeDisabled();
  });

  it('calls onSuccess callback when provided', async () => {
    const mockOnSuccess = vi.fn();

    render(<PollCreationForm onSuccess={mockOnSuccess} />);

    // Upload images
    fireEvent.click(screen.getByText('Upload A'));
    fireEvent.click(screen.getByText('Upload B'));

    // Submit form
    const submitButton = screen.getByRole('button', { name: 'Create Poll' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith('poll-123');
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('handles image upload errors', async () => {
    render(<PollCreationForm />);

    // Trigger image upload error for option A
    const optionAErrorButton = screen
      .getByTestId('image-upload-a')
      .querySelector('button:last-child');
    fireEvent.click(optionAErrorButton!);

    await waitFor(() => {
      expect(screen.getByText('Upload failed')).toBeInTheDocument();
    });
  });
});
