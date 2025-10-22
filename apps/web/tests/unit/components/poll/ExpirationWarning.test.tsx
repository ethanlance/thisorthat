import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ExpirationWarning from '@/components/poll/ExpirationWarning';

// Mock the expiration service
vi.mock('@/lib/services/expiration', () => ({
  calculateTimeLeft: vi.fn(),
  getExpirationWarningLevel: vi.fn(),
}));

import {
  calculateTimeLeft,
  getExpirationWarningLevel,
} from '@/lib/services/expiration';

describe('ExpirationWarning', () => {
  const mockExpiresAt = new Date(
    Date.now() + 24 * 60 * 60 * 1000
  ).toISOString();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when no warning level', () => {
    vi.mocked(calculateTimeLeft).mockReturnValue({
      days: 1,
      hours: 2,
      minutes: 30,
      seconds: 45,
      total: 100000,
    });
    vi.mocked(getExpirationWarningLevel).mockReturnValue('none');

    const { container } = render(
      <ExpirationWarning expiresAt={mockExpiresAt} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders critical warning', () => {
    vi.mocked(calculateTimeLeft).mockReturnValue({
      days: 0,
      hours: 0,
      minutes: 3,
      seconds: 0,
      total: 180000,
    });
    vi.mocked(getExpirationWarningLevel).mockReturnValue('critical');

    render(<ExpirationWarning expiresAt={mockExpiresAt} />);

    expect(
      screen.getByText('This poll expires in less than 5 minutes!')
    ).toBeInTheDocument();
    expect(
      screen.getByText('This poll expires in less than 5 minutes!')
    ).toHaveClass('border-red-200', 'bg-red-50');
  });

  it('renders warning level', () => {
    vi.mocked(calculateTimeLeft).mockReturnValue({
      days: 0,
      hours: 0,
      minutes: 15,
      seconds: 0,
      total: 900000,
    });
    vi.mocked(getExpirationWarningLevel).mockReturnValue('warning');

    render(<ExpirationWarning expiresAt={mockExpiresAt} />);

    expect(
      screen.getByText('This poll expires in less than 30 minutes.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('This poll expires in less than 30 minutes.')
    ).toHaveClass('border-orange-200', 'bg-orange-50');
  });

  it('renders in compact mode', () => {
    vi.mocked(calculateTimeLeft).mockReturnValue({
      days: 0,
      hours: 0,
      minutes: 3,
      seconds: 0,
      total: 180000,
    });
    vi.mocked(getExpirationWarningLevel).mockReturnValue('critical');

    render(<ExpirationWarning expiresAt={mockExpiresAt} compact />);

    expect(
      screen.getByText('This poll expires in less than 5 minutes!')
    ).toBeInTheDocument();
    expect(
      screen.getByText('This poll expires in less than 5 minutes!')
    ).toHaveClass('text-sm');
  });

  it('hides icon when showIcon is false', () => {
    vi.mocked(calculateTimeLeft).mockReturnValue({
      days: 0,
      hours: 0,
      minutes: 3,
      seconds: 0,
      total: 180000,
    });
    vi.mocked(getExpirationWarningLevel).mockReturnValue('critical');

    render(<ExpirationWarning expiresAt={mockExpiresAt} showIcon={false} />);

    expect(
      screen.getByText('This poll expires in less than 5 minutes!')
    ).toBeInTheDocument();
    // Icon should not be present
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('shows icon by default', () => {
    vi.mocked(calculateTimeLeft).mockReturnValue({
      days: 0,
      hours: 0,
      minutes: 3,
      seconds: 0,
      total: 180000,
    });
    vi.mocked(getExpirationWarningLevel).mockReturnValue('critical');

    render(<ExpirationWarning expiresAt={mockExpiresAt} />);

    // Should have an icon (AlertCircle)
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toBeInTheDocument();
  });

  it('applies custom className', () => {
    vi.mocked(calculateTimeLeft).mockReturnValue({
      days: 0,
      hours: 0,
      minutes: 15,
      seconds: 0,
      total: 900000,
    });
    vi.mocked(getExpirationWarningLevel).mockReturnValue('warning');

    render(
      <ExpirationWarning expiresAt={mockExpiresAt} className="custom-class" />
    );

    const alert = screen
      .getByText('This poll expires in less than 30 minutes.')
      .closest('[role="alert"]');
    expect(alert).toHaveClass('custom-class');
  });

  it('renders nothing when timeLeft is null', () => {
    vi.mocked(calculateTimeLeft).mockReturnValue(null);

    const { container } = render(
      <ExpirationWarning expiresAt={mockExpiresAt} />
    );

    expect(container.firstChild).toBeNull();
  });
});
