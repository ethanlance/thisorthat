import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import Home from '@/app/page';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';

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

// Mock auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    signOut: vi.fn(),
  }),
}));

describe('Home Page Navigation', () => {
  it('should render home page with correct CTA links', () => {
    render(<Home />);

    // Check that CTA buttons have correct href attributes
    const createPollButton = screen.getByText('Create Poll').closest('a');
    const browsePollsButton = screen.getByText('Browse Polls').closest('a');
    const createFirstPollButton = screen
      .getByText('Create Your First Poll')
      .closest('a');

    expect(createPollButton).toHaveAttribute('href', '/poll/create');
    expect(browsePollsButton).toHaveAttribute('href', '/polls');
    expect(createFirstPollButton).toHaveAttribute('href', '/poll/create');
  });

  it('should render header with correct navigation links', () => {
    render(<Header />);

    // Check desktop navigation links
    const homeLink = screen.getByText('Home').closest('a');
    const pollsLink = screen.getByText('Polls').closest('a');
    const aboutLink = screen.getByText('About').closest('a');

    expect(homeLink).toHaveAttribute('href', '/');
    expect(pollsLink).toHaveAttribute('href', '/polls');
    expect(aboutLink).toHaveAttribute('href', '/about');
  });

  it('should render mobile navigation with correct links', () => {
    render(<MobileNav />);

    // Check mobile navigation links
    const homeLink = screen.getByText('Home').closest('a');
    const browsePollsLink = screen.getByText('Browse Polls').closest('a');
    const aboutLink = screen.getByText('About').closest('a');

    expect(homeLink).toHaveAttribute('href', '/');
    expect(browsePollsLink).toHaveAttribute('href', '/polls');
    expect(aboutLink).toHaveAttribute('href', '/about');
  });
});
