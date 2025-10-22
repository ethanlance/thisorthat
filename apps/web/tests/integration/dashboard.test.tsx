import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DashboardPage from '@/app/(main)/dashboard/page';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPolls } from '@/lib/hooks/useUserPolls';
import { DashboardService } from '@/lib/services/dashboard';

// Mock necessary modules
vi.mock('@/contexts/AuthContext');
vi.mock('@/lib/hooks/useUserPolls');
vi.mock('@/lib/services/dashboard');

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('Dashboard Integration', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };
  const mockPolls = [
    {
      id: 'poll-1',
      creator_id: 'user-123',
      option_a_image_url: 'https://example.com/image-a1.jpg',
      option_a_label: 'Pizza',
      option_b_image_url: 'https://example.com/image-b1.jpg',
      option_b_label: 'Burger',
      description: 'What to eat for lunch?',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      is_public: true,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      vote_counts: { option_a: 5, option_b: 3 },
      share_count: 2,
      last_activity: new Date().toISOString(),
    },
    {
      id: 'poll-2',
      creator_id: 'user-123',
      option_a_image_url: 'https://example.com/image-a2.jpg',
      option_a_label: 'Coffee',
      option_b_image_url: 'https://example.com/image-b2.jpg',
      option_b_label: 'Tea',
      description: 'Morning beverage choice',
      expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      is_public: true,
      status: 'closed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      vote_counts: { option_a: 2, option_b: 8 },
      share_count: 1,
      last_activity: new Date().toISOString(),
    },
  ];

  const mockStats = {
    totalPolls: 2,
    activePolls: 1,
    closedPolls: 1,
    totalVotes: 18,
    averageVotesPerPoll: 9,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ user: mockUser });
    vi.mocked(useUserPolls).mockReturnValue({
      polls: mockPolls,
      loading: false,
      error: null,
      refetch: vi.fn(),
      deletePoll: vi.fn(),
      sharePoll: vi.fn(),
    });
    vi.mocked(DashboardService.getDashboardStats).mockResolvedValue(mockStats);
  });

  it('renders dashboard for authenticated user', () => {
    render(<DashboardPage />);

    expect(screen.getByText('My Polls')).toBeInTheDocument();
    expect(screen.getByText('Manage and track your polls')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Create Poll' })
    ).toBeInTheDocument();
  });

  it('displays dashboard statistics', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // Total polls
      expect(screen.getByText('18')).toBeInTheDocument(); // Total votes
      expect(screen.getByText('1')).toBeInTheDocument(); // Active polls
    });
  });

  it('displays user polls in grid layout', () => {
    render(<DashboardPage />);

    expect(screen.getByText('Pizza')).toBeInTheDocument();
    expect(screen.getByText('Burger')).toBeInTheDocument();
    expect(screen.getByText('Coffee')).toBeInTheDocument();
    expect(screen.getByText('Tea')).toBeInTheDocument();
  });

  it('shows loading state for stats', () => {
    vi.mocked(DashboardService.getDashboardStats).mockReturnValue(
      new Promise(() => {})
    ); // Never resolve

    render(<DashboardPage />);

    // Should show loading skeletons for stats
    expect(screen.getAllByRole('generic')).toHaveLength(expect.any(Number));
  });

  it('shows loading state for polls', () => {
    vi.mocked(useUserPolls).mockReturnValue({
      polls: [],
      loading: true,
      error: null,
      refetch: vi.fn(),
      deletePoll: vi.fn(),
      sharePoll: vi.fn(),
    });

    render(<DashboardPage />);

    // Should show loading skeletons for polls
    expect(screen.getAllByRole('generic')).toHaveLength(expect.any(Number));
  });

  it('handles stats fetch error', async () => {
    vi.mocked(DashboardService.getDashboardStats).mockRejectedValue(
      new Error('Stats fetch failed')
    );

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Stats fetch failed')).toBeInTheDocument();
    });
  });

  it('handles polls fetch error', () => {
    vi.mocked(useUserPolls).mockReturnValue({
      polls: [],
      loading: false,
      error: 'Polls fetch failed',
      refetch: vi.fn(),
      deletePoll: vi.fn(),
      sharePoll: vi.fn(),
    });

    render(<DashboardPage />);

    expect(screen.getByText('Polls fetch failed')).toBeInTheDocument();
  });

  it('redirects to create poll page when create button clicked', () => {
    render(<DashboardPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Create Poll' }));
    expect(mockPush).toHaveBeenCalledWith('/poll/create');
  });

  it('shows empty state when no polls exist', () => {
    vi.mocked(useUserPolls).mockReturnValue({
      polls: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
      deletePoll: vi.fn(),
      sharePoll: vi.fn(),
    });

    render(<DashboardPage />);

    expect(screen.getByText('No polls yet')).toBeInTheDocument();
    expect(
      screen.getByText('Create your first poll to get started!')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Create Your First Poll' })
    ).toBeInTheDocument();
  });

  it('shows expiring soon alert when polls are expiring', () => {
    const expiringPolls = [
      {
        ...mockPolls[0],
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
      },
    ];

    vi.mocked(useUserPolls).mockReturnValue({
      polls: expiringPolls,
      loading: false,
      error: null,
      refetch: vi.fn(),
      deletePoll: vi.fn(),
      sharePoll: vi.fn(),
    });

    render(<DashboardPage />);

    expect(
      screen.getByText(/You have 1 poll expiring within the next hour/)
    ).toBeInTheDocument();
  });

  it('handles poll deletion', async () => {
    const mockDeletePoll = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useUserPolls).mockReturnValue({
      polls: mockPolls,
      loading: false,
      error: null,
      refetch: vi.fn(),
      deletePoll: mockDeletePoll,
      sharePoll: vi.fn(),
    });

    render(<DashboardPage />);

    // Click the more actions button on first poll
    const moreButtons = screen.getAllByLabelText('Poll actions');
    fireEvent.click(moreButtons[0]);

    // Click delete
    fireEvent.click(screen.getByText('Delete Poll'));

    // Confirm deletion
    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(mockDeletePoll).toHaveBeenCalledWith('poll-1');
    });
  });

  it('handles poll sharing', async () => {
    const mockSharePoll = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useUserPolls).mockReturnValue({
      polls: mockPolls,
      loading: false,
      error: null,
      refetch: vi.fn(),
      deletePoll: vi.fn(),
      sharePoll: mockSharePoll,
    });

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    render(<DashboardPage />);

    // Click share button on first poll
    const shareButtons = screen.getAllByRole('button', { name: 'Share' });
    fireEvent.click(shareButtons[0]);

    await waitFor(() => {
      expect(mockSharePoll).toHaveBeenCalledWith('poll-1');
    });
  });

  it('handles poll viewing', () => {
    render(<DashboardPage />);

    // Click view button on first poll
    const viewButtons = screen.getAllByRole('button', { name: 'View' });
    fireEvent.click(viewButtons[0]);

    expect(mockPush).toHaveBeenCalledWith('/poll/poll-1');
  });

  it('shows success message after actions', async () => {
    const mockDeletePoll = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useUserPolls).mockReturnValue({
      polls: mockPolls,
      loading: false,
      error: null,
      refetch: vi.fn(),
      deletePoll: mockDeletePoll,
      sharePoll: vi.fn(),
    });

    render(<DashboardPage />);

    // Delete a poll
    const moreButtons = screen.getAllByLabelText('Poll actions');
    fireEvent.click(moreButtons[0]);
    fireEvent.click(screen.getByText('Delete Poll'));
    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(screen.getByText('Poll deleted successfully')).toBeInTheDocument();
    });
  });

  it('shows unauthenticated state', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null });

    render(<DashboardPage />);

    expect(
      screen.getByText('You must be logged in to view your dashboard.')
    ).toBeInTheDocument();
  });

  it('refreshes polls when refresh button clicked', () => {
    const mockRefetch = vi.fn();
    vi.mocked(useUserPolls).mockReturnValue({
      polls: mockPolls,
      loading: false,
      error: null,
      refetch: mockRefetch,
      deletePoll: vi.fn(),
      sharePoll: vi.fn(),
    });

    render(<DashboardPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(mockRefetch).toHaveBeenCalled();
  });
});
