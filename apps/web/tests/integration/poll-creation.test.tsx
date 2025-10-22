import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import CreatePollPage from '@/app/(main)/poll/create/page';
import { useAuth } from '@/contexts/AuthContext';
import { PollsService } from '@/lib/services/polls';
import { uploadPollImage } from '@/lib/storage/image-upload';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

vi.mock('@/lib/services/polls', () => ({
  PollsService: {
    createPoll: vi.fn(),
    updatePollWithImages: vi.fn()
  }
}));

vi.mock('@/lib/storage/image-upload', () => ({
  uploadPollImage: vi.fn()
}));

vi.mock('@/components/upload/ImageUpload', () => ({
  default: ({ option, onImageSelect, onError, disabled }: any) => (
    <div data-testid={`image-upload-${option}`}>
      <button
        onClick={() => onImageSelect(new File(['test'], 'test.jpg', { type: 'image/jpeg' }))}
        disabled={disabled}
      >
        Upload {option.toUpperCase()}
      </button>
      <button onClick={() => onError('Upload failed')}>Trigger Error</button>
    </div>
  )
}));

describe('Poll Creation Integration', () => {
  const mockPush = vi.fn();
  const mockUser = { id: 'user-123', email: 'test@example.com' };
  const mockPoll = { id: 'poll-123' };

  beforeEach(() => {
    vi.clearAllMocks();
    
    (useRouter as any).mockReturnValue({
      push: mockPush
    });
    
    (useAuth as any).mockReturnValue({
      user: mockUser
    });
    
    (PollsService.createPoll as any).mockResolvedValue(mockPoll);
    (PollsService.updatePollWithImages as any).mockResolvedValue(mockPoll);
    (uploadPollImage as any).mockResolvedValue({ success: true, url: 'https://example.com/image.jpg' });
  });

  it('should complete full poll creation flow', async () => {
    render(<CreatePollPage />);
    
    // Verify form is rendered
    expect(screen.getByText('Create a Poll')).toBeInTheDocument();
    expect(screen.getByTestId('image-upload-a')).toBeInTheDocument();
    expect(screen.getByTestId('image-upload-b')).toBeInTheDocument();
    
    // Upload images
    fireEvent.click(screen.getByText('Upload A'));
    fireEvent.click(screen.getByText('Upload B'));
    
    // Fill form fields
    fireEvent.change(screen.getByLabelText('Option A Label (optional)'), {
      target: { value: 'Pizza' }
    });
    fireEvent.change(screen.getByLabelText('Option B Label (optional)'), {
      target: { value: 'Burger' }
    });
    fireEvent.change(screen.getByLabelText('Description (optional)'), {
      target: { value: 'What should I have for dinner?' }
    });
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: 'Create Poll' });
    fireEvent.click(submitButton);
    
    // Verify loading state
    expect(screen.getByText('Creating Poll...')).toBeInTheDocument();
    
    // Wait for poll creation
    await waitFor(() => {
      expect(PollsService.createPoll).toHaveBeenCalledWith({
        creatorId: 'user-123',
        optionALabel: 'Pizza',
        optionBLabel: 'Burger',
        description: 'What should I have for dinner?',
        isPublic: true
      });
    });
    
    // Wait for image uploads
    await waitFor(() => {
      expect(uploadPollImage).toHaveBeenCalledTimes(2);
      expect(uploadPollImage).toHaveBeenCalledWith(expect.any(File), 'poll-123', 'a');
      expect(uploadPollImage).toHaveBeenCalledWith(expect.any(File), 'poll-123', 'b');
    });
    
    // Wait for poll update with image URLs
    await waitFor(() => {
      expect(PollsService.updatePollWithImages).toHaveBeenCalledWith(
        'poll-123',
        'https://example.com/image.jpg',
        'https://example.com/image.jpg'
      );
    });
    
    // Wait for redirect
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/poll/poll-123');
    });
  });

  it('should handle authentication requirement', () => {
    (useAuth as any).mockReturnValue({ user: null });
    
    render(<CreatePollPage />);
    
    expect(screen.getByText('You must be logged in to create a poll.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('should handle form validation errors', async () => {
    render(<CreatePollPage />);
    
    // Try to submit without images
    const submitButton = screen.getByRole('button', { name: 'Create Poll' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Option A image is required')).toBeInTheDocument();
      expect(screen.getByText('Option B image is required')).toBeInTheDocument();
    });
    
    // Verify no API calls were made
    expect(PollsService.createPoll).not.toHaveBeenCalled();
  });

  it('should handle database errors gracefully', async () => {
    (PollsService.createPoll as any).mockRejectedValue(new Error('Database connection failed'));
    
    render(<CreatePollPage />);
    
    // Upload images
    fireEvent.click(screen.getByText('Upload A'));
    fireEvent.click(screen.getByText('Upload B'));
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: 'Create Poll' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Database connection failed')).toBeInTheDocument();
    });
    
    // Verify no redirect occurred
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should handle image upload errors', async () => {
    (uploadPollImage as any).mockResolvedValue({ success: false, error: 'Upload failed' });
    
    render(<CreatePollPage />);
    
    // Upload images
    fireEvent.click(screen.getByText('Upload A'));
    fireEvent.click(screen.getByText('Upload B'));
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: 'Create Poll' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to upload images')).toBeInTheDocument();
    });
  });

  it('should validate field length limits in real-time', async () => {
    render(<CreatePollPage />);
    
    // Test option A label
    const optionALabel = screen.getByLabelText('Option A Label (optional)');
    fireEvent.change(optionALabel, {
      target: { value: 'A'.repeat(51) }
    });
    
    await waitFor(() => {
      expect(screen.getByText('Option A label must be 50 characters or less')).toBeInTheDocument();
    });
    
    // Test description
    const description = screen.getByLabelText('Description (optional)');
    fireEvent.change(description, {
      target: { value: 'D'.repeat(501) }
    });
    
    await waitFor(() => {
      expect(screen.getByText('Description must be 500 characters or less')).toBeInTheDocument();
    });
  });

  it('should show character count updates', () => {
    render(<CreatePollPage />);
    
    const optionALabel = screen.getByLabelText('Option A Label (optional)');
    fireEvent.change(optionALabel, { target: { value: 'Pizza' } });
    
    expect(screen.getByText('5/50 characters')).toBeInTheDocument();
    
    fireEvent.change(optionALabel, { target: { value: 'Delicious Pizza' } });
    
    expect(screen.getByText('15/50 characters')).toBeInTheDocument();
  });

  it('should disable form during submission', async () => {
    render(<CreatePollPage />);
    
    // Upload images
    fireEvent.click(screen.getByText('Upload A'));
    fireEvent.click(screen.getByText('Upload B'));
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: 'Create Poll' });
    fireEvent.click(submitButton);
    
    // Check disabled state
    expect(screen.getByText('Creating Poll...')).toBeInTheDocument();
    expect(screen.getByLabelText('Option A Label (optional)')).toBeDisabled();
    expect(screen.getByLabelText('Option B Label (optional)')).toBeDisabled();
    expect(screen.getByLabelText('Description (optional)')).toBeDisabled();
    
    // Check that submit button is disabled
    expect(screen.getByRole('button', { name: 'Creating Poll...' })).toBeDisabled();
  });
});
