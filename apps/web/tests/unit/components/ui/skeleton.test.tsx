import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Skeleton } from '@/components/ui/skeleton';

describe('Skeleton Component', () => {
  it('renders skeleton with default classes', () => {
    render(<Skeleton data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('animate-pulse', 'rounded-md', 'bg-muted');
  });

  it('applies custom className', () => {
    render(<Skeleton className="custom-skeleton" data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('custom-skeleton');
  });

  it('forwards additional props', () => {
    render(<Skeleton data-testid="test-skeleton" />);
    expect(screen.getByTestId('test-skeleton')).toBeInTheDocument();
  });

  it('renders with specific dimensions', () => {
    render(<Skeleton className="h-4 w-32" data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('h-4', 'w-32');
  });
});
