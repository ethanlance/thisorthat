import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { HomePollCard } from '@/components/poll/HomePollCard';
import { AuthProvider } from '@/contexts/AuthContext';

// Mock Supabase
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: {
                id: 'test-poll-id',
                title: 'Test Poll',
                option_a: 'Option A',
                option_b: 'Option B',
                image_a_url: 'https://example.com/image-a.jpg',
                image_b_url: 'https://example.com/image-b.jpg',
                created_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 86400000).toISOString(),
              },
              error: null,
            })
          ),
        })),
      })),
    })),
    channel: vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn(),
      })),
    })),
  },
}));

// Mock analytics
vi.mock('@/lib/analytics/events', () => ({
  trackHomepageView: vi.fn(),
  trackHomepageVote: vi.fn(),
  trackHomepageViewResults: vi.fn(),
  trackHomepageCTAClick: vi.fn(),
}));

// Mock Next.js Image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

describe('Conversion Funnel Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('tracks homepage view when component mounts', async () => {
    const { trackHomepageView } = await import('@/lib/analytics/events');

    render(
      <AuthProvider>
        <HomePollCard />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(trackHomepageView).toHaveBeenCalled();
    });
  });

  it('tracks vote submission and shows results', async () => {
    const { trackHomepageVote, trackHomepageViewResults } = await import(
      '@/lib/analytics/events'
    );

    render(
      <AuthProvider>
        <HomePollCard />
      </AuthProvider>
    );

    // Wait for poll to load
    await waitFor(() => {
      expect(screen.getByText('Test Poll')).toBeInTheDocument();
    });

    // Click vote button
    const voteButton = screen.getByText('Option A');
    fireEvent.click(voteButton);

    await waitFor(() => {
      expect(trackHomepageVote).toHaveBeenCalledWith(
        'option_a',
        'test-poll-id'
      );
    });

    // Should show results and track results view
    await waitFor(() => {
      expect(trackHomepageViewResults).toHaveBeenCalled();
    });
  });

  it('shows conversion CTAs after voting', async () => {
    render(
      <AuthProvider>
        <HomePollCard />
      </AuthProvider>
    );

    // Wait for poll to load
    await waitFor(() => {
      expect(screen.getByText('Test Poll')).toBeInTheDocument();
    });

    // Vote
    const voteButton = screen.getByText('Option A');
    fireEvent.click(voteButton);

    // Should show CTAs after results
    await waitFor(() => {
      expect(screen.getByText('Create Your Own Poll')).toBeInTheDocument();
      expect(screen.getByText('Browse More Polls')).toBeInTheDocument();
    });
  });

  it('tracks CTA clicks', async () => {
    const { trackHomepageCTAClick } = await import('@/lib/analytics/events');

    render(
      <AuthProvider>
        <HomePollCard />
      </AuthProvider>
    );

    // Wait for poll to load and vote
    await waitFor(() => {
      expect(screen.getByText('Test Poll')).toBeInTheDocument();
    });

    const voteButton = screen.getByText('Option A');
    fireEvent.click(voteButton);

    // Wait for CTAs to appear
    await waitFor(() => {
      expect(screen.getByText('Create Your Own Poll')).toBeInTheDocument();
    });

    // Click create CTA
    const createCTA = screen.getByText('Create Your Own Poll');
    fireEvent.click(createCTA);

    expect(trackHomepageCTAClick).toHaveBeenCalledWith('create');

    // Click browse CTA
    const browseCTA = screen.getByText('Browse More Polls');
    fireEvent.click(browseCTA);

    expect(trackHomepageCTAClick).toHaveBeenCalledWith('browse');
  });

  it('handles anonymous voting correctly', async () => {
    render(
      <AuthProvider>
        <HomePollCard />
      </AuthProvider>
    );

    // Wait for poll to load
    await waitFor(() => {
      expect(screen.getByText('Test Poll')).toBeInTheDocument();
    });

    // Should be able to vote without authentication
    const voteButton = screen.getByText('Option A');
    expect(voteButton).toBeEnabled();

    fireEvent.click(voteButton);

    // Should show results
    await waitFor(() => {
      expect(screen.getByText('Create Your Own Poll')).toBeInTheDocument();
    });
  });
});
