import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ResultsShare from '@/components/poll/ResultsShare';

// Mock navigator.share and navigator.clipboard
const mockShare = vi.fn();
const mockWriteText = vi.fn();

Object.defineProperty(navigator, 'share', {
  value: mockShare,
  writable: true,
});

Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: mockWriteText,
  },
  writable: true,
});

describe('ResultsShare', () => {
  const defaultProps = {
    pollId: 'test-poll-123',
    pollTitle: 'Test Poll',
    voteCounts: { option_a: 30, option_b: 20 },
    optionLabels: { option_a: 'Option A', option_b: 'Option B' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockShare.mockClear();
    mockWriteText.mockClear();
  });

  it('should render share button', () => {
    render(<ResultsShare {...defaultProps} />);

    expect(screen.getByText('Share Results')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should use native share when available', async () => {
    mockShare.mockResolvedValue(undefined);

    render(<ResultsShare {...defaultProps} />);

    const shareButton = screen.getByText('Share Results');
    fireEvent.click(shareButton);

    await waitFor(() => {
      expect(mockShare).toHaveBeenCalledWith({
        title: 'Poll Results: Test Poll',
        text: 'Check out the results of "Test Poll": Option A (30 votes) vs Option B (20 votes)',
        url: expect.stringContaining('/poll/test-poll-123'),
      });
    });
  });

  it('should fallback to clipboard when native share is not available', async () => {
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      writable: true,
    });

    mockWriteText.mockResolvedValue(undefined);

    render(<ResultsShare {...defaultProps} />);

    const shareButton = screen.getByText('Share Results');
    fireEvent.click(shareButton);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(
        expect.stringContaining('Check out the results of "Test Poll"')
      );
    });

    expect(screen.getByText('Results Copied!')).toBeInTheDocument();
  });

  it('should show success message after clipboard copy', async () => {
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      writable: true,
    });

    mockWriteText.mockResolvedValue(undefined);

    render(<ResultsShare {...defaultProps} />);

    const shareButton = screen.getByText('Share Results');
    fireEvent.click(shareButton);

    await waitFor(() => {
      expect(screen.getByText('Results Copied!')).toBeInTheDocument();
    });

    expect(
      screen.getByText('Results copied to clipboard!')
    ).toBeInTheDocument();
  });

  it('should handle share errors gracefully', async () => {
    mockShare.mockRejectedValue(new Error('Share failed'));

    render(<ResultsShare {...defaultProps} />);

    const shareButton = screen.getByText('Share Results');
    fireEvent.click(shareButton);

    // Should not throw error
    await waitFor(() => {
      expect(mockShare).toHaveBeenCalled();
    });
  });

  it('should handle clipboard errors gracefully', async () => {
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      writable: true,
    });

    mockWriteText.mockRejectedValue(new Error('Clipboard failed'));

    render(<ResultsShare {...defaultProps} />);

    const shareButton = screen.getByText('Share Results');
    fireEvent.click(shareButton);

    // Should not throw error
    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalled();
    });
  });

  it('should apply custom className', () => {
    render(<ResultsShare {...defaultProps} className="custom-class" />);

    const container = screen
      .getByText('Share Results')
      .closest('div')?.parentElement;
    expect(container).toHaveClass('custom-class');
  });

  it('should generate correct share text', async () => {
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      writable: true,
    });

    mockWriteText.mockResolvedValue(undefined);

    render(<ResultsShare {...defaultProps} />);

    const shareButton = screen.getByText('Share Results');
    fireEvent.click(shareButton);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(
        'Check out the results of "Test Poll": Option A (30 votes) vs Option B (20 votes)\n' +
          expect.stringContaining('/poll/test-poll-123')
      );
    });
  });

  it('should update button text after successful share', async () => {
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      writable: true,
    });

    mockWriteText.mockResolvedValue(undefined);

    render(<ResultsShare {...defaultProps} />);

    const shareButton = screen.getByText('Share Results');
    fireEvent.click(shareButton);

    await waitFor(() => {
      expect(screen.getByText('Results Copied!')).toBeInTheDocument();
    });
  });
});
