import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ConversionCTA } from '@/components/poll/ConversionCTA';

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock analytics
vi.mock('@/lib/analytics/events', () => ({
  trackEvent: vi.fn(),
}));

describe('ConversionCTA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders primary and secondary CTAs', () => {
    render(<ConversionCTA />);
    
    expect(screen.getByText('Create Your Own Poll')).toBeInTheDocument();
    expect(screen.getByText('Browse More Polls')).toBeInTheDocument();
  });

  it('shows pulse animation after 5 seconds', async () => {
    vi.useFakeTimers();
    
    render(<ConversionCTA />);
    
    // Initially no pulse animation
    const createButton = screen.getByText('Create Your Own Poll');
    expect(createButton).not.toHaveClass('animate-pulse');
    
    // Fast forward 5 seconds
    vi.advanceTimersByTime(5000);
    
    await waitFor(() => {
      expect(createButton).toHaveClass('animate-pulse');
    });
    
    vi.useRealTimers();
  });

  it('respects prefers-reduced-motion', () => {
    // Mock prefers-reduced-motion
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    render(<ConversionCTA />);
    
    const createButton = screen.getByText('Create Your Own Poll');
    expect(createButton).not.toHaveClass('animate-pulse');
  });

  it('has correct links for CTAs', () => {
    render(<ConversionCTA />);
    
    const createLink = screen.getByText('Create Your Own Poll').closest('a');
    const browseLink = screen.getByText('Browse More Polls').closest('a');
    
    expect(createLink).toHaveAttribute('href', '/poll/create');
    expect(browseLink).toHaveAttribute('href', '/polls');
  });

  it('has proper styling classes', () => {
    render(<ConversionCTA />);
    
    const createButton = screen.getByText('Create Your Own Poll');
    const browseButton = screen.getByText('Browse More Polls');
    
    expect(createButton).toHaveClass('w-full', 'h-14', 'text-lg', 'font-semibold');
    expect(browseButton).toHaveClass('w-full');
  });

  it('includes icons in buttons', () => {
    render(<ConversionCTA />);
    
    // Check for Plus icon in create button
    const createButton = screen.getByText('Create Your Own Poll');
    const plusIcon = createButton.querySelector('svg');
    expect(plusIcon).toBeInTheDocument();
  });
});
