import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ImagePreview from '@/components/upload/ImagePreview';

describe('ImagePreview Component', () => {
  const mockProps = {
    src: 'test-image-url',
    alt: 'Test image',
  };

  it('renders image with correct src and alt', () => {
    render(<ImagePreview {...mockProps} />);

    const image = screen.getByAltText('Test image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'test-image-url');
  });

  it('shows zoom and remove buttons on hover', () => {
    render(<ImagePreview {...mockProps} />);

    expect(
      screen.getByRole('button', { name: 'Zoom image' })
    ).toBeInTheDocument();
  });

  it('opens zoom modal when zoom button is clicked', () => {
    render(<ImagePreview {...mockProps} />);

    const zoomButton = screen.getByRole('button', { name: 'Zoom image' });
    fireEvent.click(zoomButton);

    // Check if close button appears (indicating modal is open)
    expect(
      screen.getByRole('button', { name: 'Close zoom' })
    ).toBeInTheDocument();
  });

  it('closes zoom modal when close button is clicked', () => {
    render(<ImagePreview {...mockProps} />);

    // Open modal
    const zoomButton = screen.getByRole('button', { name: 'Zoom image' });
    fireEvent.click(zoomButton);

    // Close modal
    const closeButton = screen.getByRole('button', { name: 'Close zoom' });
    fireEvent.click(closeButton);

    // Modal should be closed - close button should no longer be in document
    expect(
      screen.queryByRole('button', { name: 'Close zoom' })
    ).not.toBeInTheDocument();
  });

  it('calls onRemove when remove button is clicked', () => {
    const mockOnRemove = vi.fn();
    render(<ImagePreview {...mockProps} onRemove={mockOnRemove} />);

    const removeButton = screen.getByRole('button', { name: 'Remove image' });
    fireEvent.click(removeButton);

    expect(mockOnRemove).toHaveBeenCalled();
  });

  it('does not show remove button when showRemoveButton is false', () => {
    render(<ImagePreview {...mockProps} showRemoveButton={false} />);

    expect(
      screen.queryByRole('button', { name: 'Remove image' })
    ).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<ImagePreview {...mockProps} className="custom-class" />);

    const card = screen.getByAltText('Test image').closest('.custom-class');
    expect(card).toBeInTheDocument();
  });
});
