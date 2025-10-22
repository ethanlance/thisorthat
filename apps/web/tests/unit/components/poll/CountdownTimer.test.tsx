import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import CountdownTimer from '@/components/poll/CountdownTimer';

// Mock the expiration service
vi.mock('@/lib/services/expiration', () => ({
  calculateTimeLeft: vi.fn(),
  formatTimeLeft: vi.fn(),
  getExpirationWarningLevel: vi.fn(),
}));

import {
  calculateTimeLeft,
  formatTimeLeft,
  getExpirationWarningLevel,
} from '@/lib/services/expiration';

describe('CountdownTimer', () => {
  const mockExpiresAt = new Date(
    Date.now() + 24 * 60 * 60 * 1000
  ).toISOString();
  const mockOnExpire = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders countdown timer with time left', () => {
    const mockTimeLeft = {
      days: 1,
      hours: 2,
      minutes: 30,
      seconds: 45,
      total: 100000,
    };

    (calculateTimeLeft as any).mockReturnValue(mockTimeLeft);
    (formatTimeLeft as any).mockReturnValue('1d 2h 30m');
    (getExpirationWarningLevel as any).mockReturnValue('none');

    render(<CountdownTimer expiresAt={mockExpiresAt} />);

    expect(screen.getByText('1d 2h 30m')).toBeInTheDocument();
  });

  it('renders expired state when time is up', () => {
    (calculateTimeLeft as any).mockReturnValue(null);

    render(<CountdownTimer expiresAt={mockExpiresAt} />);

    expect(screen.getByText('Expired')).toBeInTheDocument();
    expect(screen.getByText('Expired')).toHaveClass('text-red-600');
  });

  it('renders calculating state initially', () => {
    (calculateTimeLeft as any).mockReturnValue(null);

    render(<CountdownTimer expiresAt={mockExpiresAt} />);

    expect(screen.getByText('Calculating...')).toBeInTheDocument();
  });

  it('calls onExpire callback when timer expires', () => {
    (calculateTimeLeft as any).mockReturnValue(null);

    render(
      <CountdownTimer expiresAt={mockExpiresAt} onExpire={mockOnExpire} />
    );

    expect(mockOnExpire).toHaveBeenCalled();
  });

  it('shows warning styles for critical expiration', () => {
    const mockTimeLeft = {
      days: 0,
      hours: 0,
      minutes: 3,
      seconds: 0,
      total: 180000,
    };

    (calculateTimeLeft as any).mockReturnValue(mockTimeLeft);
    (formatTimeLeft as any).mockReturnValue('3m');
    (getExpirationWarningLevel as any).mockReturnValue('critical');

    render(<CountdownTimer expiresAt={mockExpiresAt} />);

    const timer = screen.getByText('3m');
    expect(timer).toHaveClass('text-red-600', 'animate-pulse');
    expect(screen.getByText('Expires soon!')).toBeInTheDocument();
  });

  it('shows warning styles for warning expiration', () => {
    const mockTimeLeft = {
      days: 0,
      hours: 0,
      minutes: 15,
      seconds: 0,
      total: 900000,
    };

    (calculateTimeLeft as any).mockReturnValue(mockTimeLeft);
    (formatTimeLeft as any).mockReturnValue('15m');
    (getExpirationWarningLevel as any).mockReturnValue('warning');

    render(<CountdownTimer expiresAt={mockExpiresAt} />);

    const timer = screen.getByText('15m');
    expect(timer).toHaveClass('text-orange-600');
    expect(screen.getByText('Expiring soon')).toBeInTheDocument();
  });

  it('renders in compact mode', () => {
    const mockTimeLeft = {
      days: 1,
      hours: 2,
      minutes: 30,
      seconds: 45,
      total: 100000,
    };

    (calculateTimeLeft as any).mockReturnValue(mockTimeLeft);
    (formatTimeLeft as any).mockReturnValue('1d 2h 30m');
    (getExpirationWarningLevel as any).mockReturnValue('none');

    render(<CountdownTimer expiresAt={mockExpiresAt} compact />);

    expect(screen.getByText('1d 2h 30m')).toBeInTheDocument();
    expect(screen.queryByText('Expiring soon')).not.toBeInTheDocument();
  });

  it('updates timer every second', () => {
    const mockTimeLeft1 = {
      days: 0,
      hours: 0,
      minutes: 1,
      seconds: 30,
      total: 90000,
    };

    const mockTimeLeft2 = {
      days: 0,
      hours: 0,
      minutes: 1,
      seconds: 29,
      total: 89000,
    };

    (calculateTimeLeft as any)
      .mockReturnValueOnce(mockTimeLeft1)
      .mockReturnValueOnce(mockTimeLeft2);

    (formatTimeLeft as any)
      .mockReturnValueOnce('1m 30s')
      .mockReturnValueOnce('1m 29s');

    (getExpirationWarningLevel as any).mockReturnValue('none');

    render(<CountdownTimer expiresAt={mockExpiresAt} />);

    expect(screen.getByText('1m 30s')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText('1m 29s')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const mockTimeLeft = {
      days: 1,
      hours: 2,
      minutes: 30,
      seconds: 45,
      total: 100000,
    };

    (calculateTimeLeft as any).mockReturnValue(mockTimeLeft);
    (formatTimeLeft as any).mockReturnValue('1d 2h 30m');
    (getExpirationWarningLevel as any).mockReturnValue('none');

    render(
      <CountdownTimer expiresAt={mockExpiresAt} className="custom-class" />
    );

    const container = screen.getByText('1d 2h 30m').parentElement;
    expect(container).toHaveClass('custom-class');
  });
});
