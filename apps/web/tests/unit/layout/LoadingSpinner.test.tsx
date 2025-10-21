import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LoadingSpinner from '@/components/layout/LoadingSpinner';

describe('LoadingSpinner Component', () => {
  it('renders the loading spinner', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status', { hidden: true });
    expect(spinner).toBeInTheDocument();
  });

  it('has proper styling classes', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status', { hidden: true });
    expect(spinner).toHaveClass('animate-spin');
  });
});
