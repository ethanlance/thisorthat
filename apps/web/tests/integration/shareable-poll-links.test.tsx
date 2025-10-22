import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PollShare from '@/components/poll/PollShare';
import { createClient } from '@/lib/supabase/client';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

const mockSupabase = {
  from: vi.fn(),
  insert: vi.fn(),
};

const mockQuery = {
  insert: vi.fn().mockResolvedValue({ error: null }),
};

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

describe('Shareable Poll Links Integration', () => {
  const mockPoll = {
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
    (createClient as vi.Mock).mockReturnValue(mockSupabase);
    mockSupabase.from.mockReturnValue(mockQuery);
    mockShare.mockClear();
    mockWriteText.mockClear();
    (global.fetch as vi.Mock).mockClear();
  });

  it('should handle complete sharing flow with native share', async () => {
    mockShare.mockResolvedValue(undefined);
    (global.fetch as vi.Mock).mockResolvedValue({ ok: true });

    render(<PollShare {...mockPoll} />);

    const shareButton = screen.getByText('Share Poll');
    fireEvent.click(shareButton);

    await waitFor(() => {
      expect(mockShare).toHaveBeenCalledWith({
        title: 'Test Poll',
        text: 'Test Poll: Test Description',
        url: expect.stringContaining('/poll/test-poll-123'),
      });
    });

    // Verify analytics tracking
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

  it('should handle complete sharing flow with clipboard fallback', async () => {
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      writable: true,
    });

    mockWriteText.mockResolvedValue(undefined);
    (global.fetch as vi.Mock).mockResolvedValue({ ok: true });

    render(<PollShare {...mockPoll} />);

    const shareButton = screen.getByText('Share Poll');
    fireEvent.click(shareButton);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(
        expect.stringContaining('/poll/test-poll-123')
      );
    });

    expect(screen.getByText('Link Copied!')).toBeInTheDocument();

    // Verify analytics tracking
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/analytics/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pollId: 'test-poll-123',
          method: 'clipboard',
          timestamp: expect.any(String),
        }),
      });
    });
  });

  it('should handle social media sharing', async () => {
    const mockOpen = vi.fn();
    window.open = mockOpen;

    render(<PollShare {...mockPoll} />);

    // Test Twitter sharing
    const twitterButton = screen.getByText('Twitter');
    fireEvent.click(twitterButton);

    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining('twitter.com/intent/tweet'),
      '_blank',
      'width=600,height=400'
    );

    // Test Facebook sharing
    const facebookButton = screen.getByText('Facebook');
    fireEvent.click(facebookButton);

    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining('facebook.com/sharer'),
      '_blank',
      'width=600,height=400'
    );

    // Test WhatsApp sharing
    const whatsappButton = screen.getByText('WhatsApp');
    fireEvent.click(whatsappButton);

    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining('wa.me'),
      '_blank',
      'width=600,height=400'
    );

    // Test Telegram sharing
    const telegramButton = screen.getByText('Telegram');
    fireEvent.click(telegramButton);

    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining('t.me/share'),
      '_blank',
      'width=600,height=400'
    );
  });

  it('should handle copy link functionality', async () => {
    mockWriteText.mockResolvedValue(undefined);
    (global.fetch as vi.Mock).mockResolvedValue({ ok: true });

    render(<PollShare {...mockPoll} />);

    const copyButton = screen.getByText('Copy Link');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(
        expect.stringContaining('/poll/test-poll-123')
      );
    });

    expect(screen.getByText('Link Copied!')).toBeInTheDocument();
    expect(
      screen.getByText('Poll link copied to clipboard!')
    ).toBeInTheDocument();
  });

  it('should handle share errors gracefully', async () => {
    mockShare.mockRejectedValue(new Error('Share failed'));

    render(<PollShare {...mockPoll} />);

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

    render(<PollShare {...mockPoll} />);

    const shareButton = screen.getByText('Share Poll');
    fireEvent.click(shareButton);

    // Should not throw error
    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalled();
    });
  });

  it('should handle analytics tracking errors gracefully', async () => {
    mockShare.mockResolvedValue(undefined);
    (global.fetch as vi.Mock).mockRejectedValue(new Error('Analytics failed'));

    render(<PollShare {...mockPoll} />);

    const shareButton = screen.getByText('Share Poll');
    fireEvent.click(shareButton);

    // Should not throw error
    await waitFor(() => {
      expect(mockShare).toHaveBeenCalled();
    });
  });

  it('should generate correct share URLs for different platforms', async () => {
    const mockOpen = vi.fn();
    window.open = mockOpen;

    render(<PollShare {...mockPoll} />);

    // Test all social media buttons
    const socialButtons = ['Twitter', 'Facebook', 'WhatsApp', 'Telegram'];

    for (const platform of socialButtons) {
      const button = screen.getByText(platform);
      fireEvent.click(button);
    }

    expect(mockOpen).toHaveBeenCalledTimes(4);

    // Verify each platform has correct URL structure
    const calls = mockOpen.mock.calls;
    expect(calls[0][0]).toContain('twitter.com/intent/tweet');
    expect(calls[1][0]).toContain('facebook.com/sharer');
    expect(calls[2][0]).toContain('wa.me');
    expect(calls[3][0]).toContain('t.me/share');
  });

  it('should show success message after successful share', async () => {
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      writable: true,
    });

    mockWriteText.mockResolvedValue(undefined);

    render(<PollShare {...mockPoll} />);

    const shareButton = screen.getByText('Share Poll');
    fireEvent.click(shareButton);

    await waitFor(() => {
      expect(screen.getByText('Link Copied!')).toBeInTheDocument();
    });

    expect(
      screen.getByText('Poll link copied to clipboard!')
    ).toBeInTheDocument();
  });

  it('should handle poll without description', async () => {
    const pollWithoutDescription = {
      ...mockPoll,
      pollDescription: undefined,
    };

    mockShare.mockResolvedValue(undefined);

    render(<PollShare {...pollWithoutDescription} />);

    const shareButton = screen.getByText('Share Poll');
    fireEvent.click(shareButton);

    await waitFor(() => {
      expect(mockShare).toHaveBeenCalledWith({
        title: 'Test Poll',
        text: 'Test Poll',
        url: expect.stringContaining('/poll/test-poll-123'),
      });
    });
  });
});
