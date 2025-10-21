import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UploadProgress from '@/components/upload/UploadProgress';

describe('UploadProgress Component', () => {
  it('renders uploading state correctly', () => {
    render(
      <UploadProgress
        progress={50}
        status="uploading"
      />
    );
    
    expect(screen.getByText('Uploading...')).toBeInTheDocument();
    // Progress starts at 0 due to useEffect delay
    expect(screen.getByText(/\d+%/)).toBeInTheDocument();
  });

  it('renders success state correctly', () => {
    render(
      <UploadProgress
        progress={100}
        status="success"
      />
    );
    
    expect(screen.getByText('Upload complete')).toBeInTheDocument();
  });

  it('renders error state correctly', () => {
    render(
      <UploadProgress
        progress={0}
        status="error"
        error="Upload failed"
      />
    );
    
    expect(screen.getAllByText('Upload failed').length).toBeGreaterThan(0);
  });

  it('shows retry button when onRetry is provided', () => {
    const mockRetry = vi.fn();
    render(
      <UploadProgress
        progress={0}
        status="error"
        error="Upload failed"
        onRetry={mockRetry}
      />
    );
    
    const retryButton = screen.getByText('Try again');
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(mockRetry).toHaveBeenCalled();
  });

  it('applies custom className', () => {
    render(
      <UploadProgress
        progress={50}
        status="uploading"
        className="custom-class"
      />
    );
    
    const card = screen.getByText('Uploading...').closest('.custom-class');
    expect(card).toBeInTheDocument();
  });

  it('shows progress bar with correct width', () => {
    const { container } = render(
      <UploadProgress
        progress={75}
        status="uploading"
      />
    );
    
    const progressBar = container.querySelector('.bg-primary');
    expect(progressBar).toBeInTheDocument();
  });
});
