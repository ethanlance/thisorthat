import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { PollsList } from '@/components/poll/PollsList';
import { PollsService } from '@/lib/services/polls';

// Mock the PollsService
vi.mock('@/lib/services/polls', () => ({
  PollsService: {
    getPollsByStatus: vi.fn(),
  },
}));

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    [key: string]: unknown;
  }) => <img src={src} alt={alt} {...props} />,
}));

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockPolls = [
  {
    id: 'poll-1',
    creator_id: 'user-1',
    option_a_label: 'Pizza',
    option_b_label: 'Burger',
    option_a_image_url: 'https://example.com/pizza.jpg',
    option_b_image_url: 'https://example.com/burger.jpg',
    description: 'What should we have for dinner?',
    status: 'active',
    is_public: true,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    vote_counts: {
      option_a: 5,
      option_b: 3,
    },
  },
  {
    id: 'poll-2',
    creator_id: 'user-2',
    option_a_label: 'Coffee',
    option_b_label: 'Tea',
    option_a_image_url: 'https://example.com/coffee.jpg',
    option_b_image_url: 'https://example.com/tea.jpg',
    description: 'Morning beverage choice',
    status: 'closed',
    is_public: true,
    expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    vote_counts: {
      option_a: 2,
      option_b: 4,
    },
  },
];

describe('PollsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    vi.mocked(PollsService.getPollsByStatus).mockResolvedValue([]);

    render(<PollsList />);

    expect(screen.getByText('Loading polls...')).toBeInTheDocument();
  });

  it('should render polls when loaded', async () => {
    vi.mocked(PollsService.getPollsByStatus).mockResolvedValue(mockPolls);

    render(<PollsList />);

    await waitFor(() => {
      expect(screen.getByText('Pizza')).toBeInTheDocument();
      expect(screen.getByText('Burger')).toBeInTheDocument();
      expect(screen.getByText('Coffee')).toBeInTheDocument();
      expect(screen.getByText('Tea')).toBeInTheDocument();
    });
  });

  it('should render empty state when no polls', async () => {
    vi.mocked(PollsService.getPollsByStatus).mockResolvedValue([]);

    render(<PollsList />);

    await waitFor(() => {
      expect(screen.getByText('No polls found')).toBeInTheDocument();
      expect(
        screen.getByText(
          'There are no active polls at the moment. Check back later or create your own!'
        )
      ).toBeInTheDocument();
    });
  });

  it('should render error state when fetch fails', async () => {
    vi.mocked(PollsService.getPollsByStatus).mockRejectedValue(
      new Error('Failed to fetch')
    );

    render(<PollsList />);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load polls. Please try again.')
      ).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  it('should show correct vote counts and percentages', async () => {
    vi.mocked(PollsService.getPollsByStatus).mockResolvedValue([mockPolls[0]]);

    render(<PollsList />);

    await waitFor(() => {
      expect(screen.getByText('8 votes')).toBeInTheDocument();
      expect(screen.getByText('63%')).toBeInTheDocument();
      expect(screen.getByText('38%')).toBeInTheDocument();
    });
  });

  it('should show correct poll status badges', async () => {
    vi.mocked(PollsService.getPollsByStatus).mockResolvedValue(mockPolls);

    render(<PollsList />);

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Closed')).toBeInTheDocument();
    });
  });
});
