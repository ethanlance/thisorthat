import { render, screen } from '@testing-library/react';
import VoteCountDisplay from '@/components/poll/VoteCountDisplay';

describe('VoteCountDisplay', () => {
  const defaultProps = {
    voteCounts: { option_a: 30, option_b: 20 },
    optionLabels: { option_a: 'Option A', option_b: 'Option B' },
    isConnected: true,
    lastUpdate: new Date(),
    error: null,
  };

  it('should render vote counts correctly', () => {
    render(<VoteCountDisplay {...defaultProps} />);

    expect(screen.getByText('50')).toBeInTheDocument(); // Total votes
    expect(screen.getByText('Total Votes')).toBeInTheDocument();
    expect(screen.getByText('30 votes (60%)')).toBeInTheDocument();
    expect(screen.getByText('20 votes (40%)')).toBeInTheDocument();
  });

  it('should display option labels', () => {
    render(<VoteCountDisplay {...defaultProps} />);

    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
  });

  it('should show connection status when disconnected', () => {
    render(<VoteCountDisplay {...defaultProps} isConnected={false} />);

    expect(
      screen.getByText('Connection lost. Attempting to reconnect...')
    ).toBeInTheDocument();
  });

  it('should not show connection status when connected', () => {
    render(<VoteCountDisplay {...defaultProps} />);

    expect(screen.queryByText('Connection lost')).not.toBeInTheDocument();
  });

  it('should display error message when provided', () => {
    render(<VoteCountDisplay {...defaultProps} error="Connection failed" />);

    expect(screen.getByText('Connection failed')).toBeInTheDocument();
  });

  it('should not display error message when null', () => {
    render(<VoteCountDisplay {...defaultProps} />);

    expect(screen.queryByText('Connection failed')).not.toBeInTheDocument();
  });

  it('should calculate percentages correctly', () => {
    render(<VoteCountDisplay {...defaultProps} />);

    expect(screen.getByText('30 votes (60%)')).toBeInTheDocument();
    expect(screen.getByText('20 votes (40%)')).toBeInTheDocument();
  });

  it('should handle zero votes', () => {
    render(
      <VoteCountDisplay
        {...defaultProps}
        voteCounts={{ option_a: 0, option_b: 0 }}
      />
    );

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getAllByText('0 votes (0%)')).toHaveLength(2);
  });

  it('should handle single vote', () => {
    render(
      <VoteCountDisplay
        {...defaultProps}
        voteCounts={{ option_a: 1, option_b: 0 }}
      />
    );

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('1 votes (100%)')).toBeInTheDocument();
    expect(screen.getByText('0 votes (0%)')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<VoteCountDisplay {...defaultProps} className="custom-class" />);

    const container = screen
      .getByText('Total Votes')
      .closest('div')?.parentElement;
    expect(container).toHaveClass('custom-class');
  });

  it('should show last update time in connection status', () => {
    const lastUpdate = new Date('2023-01-01T12:00:00Z');

    render(
      <VoteCountDisplay
        {...defaultProps}
        isConnected={false}
        lastUpdate={lastUpdate}
      />
    );

    expect(screen.getByText(/Last update:/)).toBeInTheDocument();
  });

  it('should handle large vote counts', () => {
    render(
      <VoteCountDisplay
        {...defaultProps}
        voteCounts={{ option_a: 1000, option_b: 2000 }}
      />
    );

    expect(screen.getByText('3000')).toBeInTheDocument();
    expect(screen.getByText('1000 votes (33%)')).toBeInTheDocument();
    expect(screen.getByText('2000 votes (67%)')).toBeInTheDocument();
  });
});
