import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Footer from '@/components/layout/Footer';

describe('Footer Component', () => {
  it('renders the ThisOrThat brand', () => {
    render(<Footer />);
    expect(screen.getByText('ThisOrThat')).toBeInTheDocument();
  });

  it('renders footer links', () => {
    render(<Footer />);
    expect(screen.getByText('Browse Polls')).toBeInTheDocument();
    expect(screen.getByText('Create Poll')).toBeInTheDocument();
    expect(screen.getByText('About Us')).toBeInTheDocument();
    expect(screen.getByText('Help Center')).toBeInTheDocument();
  });

  it('renders copyright notice', () => {
    render(<Footer />);
    expect(screen.getByText(/© 2025 ThisOrThat/)).toBeInTheDocument();
  });

  it('has proper link attributes', () => {
    render(<Footer />);
    const browsePollsLink = screen.getByText('Browse Polls');
    expect(browsePollsLink).toHaveAttribute('href', '/polls');
  });
});
