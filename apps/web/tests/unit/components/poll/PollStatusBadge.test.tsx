import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PollStatusBadge from '@/components/poll/PollStatusBadge';
import { PollStatus } from '@/lib/services/expiration';

describe('PollStatusBadge', () => {
  it('renders active status badge', () => {
    render(<PollStatusBadge status="active" />);

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Active')).toHaveClass(
      'bg-green-100',
      'text-green-800'
    );
  });

  it('renders closed status badge', () => {
    render(<PollStatusBadge status="closed" />);

    expect(screen.getByText('Closed')).toBeInTheDocument();
    expect(screen.getByText('Closed')).toHaveClass(
      'bg-gray-100',
      'text-gray-800'
    );
  });

  it('renders deleted status badge', () => {
    render(<PollStatusBadge status="deleted" />);

    expect(screen.getByText('Deleted')).toBeInTheDocument();
    expect(screen.getByText('Deleted')).toHaveClass(
      'bg-red-100',
      'text-red-800'
    );
  });

  it('applies custom className', () => {
    render(<PollStatusBadge status="active" className="custom-class" />);

    const badge = screen.getByText('Active');
    expect(badge).toHaveClass('custom-class');
  });

  it('renders with small size', () => {
    render(<PollStatusBadge status="active" size="sm" />);

    const badge = screen.getByText('Active');
    expect(badge).toHaveClass('text-xs', 'px-2', 'py-1');
  });

  it('renders with medium size by default', () => {
    render(<PollStatusBadge status="active" />);

    const badge = screen.getByText('Active');
    expect(badge).toHaveClass('text-sm', 'px-2.5', 'py-1.5');
  });

  it('renders with large size', () => {
    render(<PollStatusBadge status="active" size="lg" />);

    const badge = screen.getByText('Active');
    expect(badge).toHaveClass('text-base', 'px-3', 'py-2');
  });

  it('has proper accessibility attributes', () => {
    render(<PollStatusBadge status="active" />);

    const badge = screen.getByText('Active');
    expect(badge).toHaveAttribute('data-slot', 'badge');
  });
});
