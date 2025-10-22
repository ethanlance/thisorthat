import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PollShare from '@/components/poll/PollShare';

// Mock fetch for analytics tracking
global.fetch = vi.fn();

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

describe('PollShare', () => {
  const defaultProps = {
    pollId: 'test-poll-123',
    pollTitle: 'Test Poll',
    pollDescription: 'Test Description',
    pollImages: {
      option_a: 'https://example.com/image-a.jpg',
      option_b: 'https://example.com/image-b.jpg',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockShare.mockClear();
    mockWriteText.mockClear();
    (global.fetch as vi.Mock).mockClear();
  });

  it('should render share button and social media options', () => {
    render(<PollShare {...defaultProps} />);

    expect(screen.getByText('Share Poll')).toBeInTheDocument();
    expect(screen.getByText('Twitter')).toBeInTheDocument();
    expect(screen.getByText('Facebook')).toBeInTheDocument();
    expect(screen.getByText('WhatsApp')).toBeInTheDocument();
    expect(screen.getByText('Telegram')).toBeInTheDocument();
    expect(screen.getByText('Copy Link')).toBeInTheDocument();
  });

  it('should use native share when available', async () => {
    mockShare.mockResolvedValue(undefined);
    (global.fetch as vi.Mock).mockResolvedValue({ ok: true });

    render(<PollShare {...defaultProps} />);

    const shareButton = screen.getByText('Share Poll');
    fireEvent.click(shareButton);

    await waitFor(() => {
      expect(mockShare).toHaveBeenCalledWith({
        title: 'Test Poll',
        text: 'Test Poll: Test Description',
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
    (global.fetch as vi.Mock).mockResolvedValue({ ok: true });

    render(<PollShare {...defaultProps} />);

    const shareButton = screen.getByText('Share Poll');
    fireEvent.click(shareButton);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(
        expect.stringContaining('/poll/test-poll-123')
      );
    });

    expect(screen.getByText('Link Copied!')).toBeInTheDocument();
  });

  it('should handle social media sharing', async () => {
    const mockOpen = vi.fn();
    window.open = mockOpen;

    render(<PollShare {...defaultProps} />);

    const twitterButton = screen.getByText('Twitter');
    fireEvent.click(twitterButton);

    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining('twitter.com/intent/tweet'),
      '_blank',
      'width=600,height=400'
    );
  });

  it('should handle copy link functionality', async () => {
    mockWriteText.mockResolvedValue(undefined);
    (global.fetch as vi.Mock).mockResolvedValue({ ok: true });

    render(<PollShare {...defaultProps} />);

    const copyButton = screen.getByText('Copy Link');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(
        expect.stringContaining('/poll/test-poll-123')
      );
    });

    expect(screen.getByText('Link Copied!')).toBeInTheDocument();
  });

  it('should track share analytics', async () => {
    mockShare.mockResolvedValue(undefined);
    (global.fetch as vi.Mock).mockResolvedValue({ ok: true });

    render(<PollShare {...defaultProps} />);

    const shareButton = screen.getByText('Share Poll');
    fireEvent.click(shareButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/analytics/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pollId: 'test-poll-123',
          method: 'native',
          timestamp: expect.any(String),
        }),
      });
    });
  });

  it('should handle share errors gracefully', async () => {
    mockShare.mockRejectedValue(new Error('Share failed'));

    render(<PollShare {...defaultProps} />);

    const shareButton = screen.getByText('Share Poll');
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

    render(<PollShare {...defaultProps} />);

    const shareButton = screen.getByText('Share Poll');
    fireEvent.click(shareButton);

    // Should not throw error
    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalled();
    });
  });

  it('should apply custom className', () => {
    render(<PollShare {...defaultProps} className="custom-class" />);

    const container = screen
      .getByText('Share Poll')
      .closest('div')?.parentElement;
    expect(container).toHaveClass('custom-class');
  });

  it('should generate correct share text without description', () => {
    const propsWithoutDescription = {
      ...defaultProps,
      pollDescription: undefined,
    };

    render(<PollShare {...propsWithoutDescription} />);

    const shareButton = screen.getByText('Share Poll');
    fireEvent.click(shareButton);

    expect(mockShare).toHaveBeenCalledWith({
      title: 'Test Poll',
      text: 'Test Poll',
      url: expect.stringContaining('/poll/test-poll-123'),
    });
  });

  it('should show success message after successful share', async () => {
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      writable: true,
    });

    mockWriteText.mockResolvedValue(undefined);

    render(<PollShare {...defaultProps} />);

    const shareButton = screen.getByText('Share Poll');
    fireEvent.click(shareButton);

    await waitFor(() => {
      expect(screen.getByText('Link Copied!')).toBeInTheDocument();
    });

    expect(
      screen.getByText('Poll link copied to clipboard!')
    ).toBeInTheDocument();
  });
});
