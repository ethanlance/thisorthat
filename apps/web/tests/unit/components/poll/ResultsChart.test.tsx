import { render, screen } from '@testing-library/react';
import ResultsChart from '@/components/poll/ResultsChart';

describe('ResultsChart', () => {
  const defaultProps = {
    voteCounts: { option_a: 30, option_b: 20 },
    optionLabels: { option_a: 'Option A', option_b: 'Option B' },
    pollStatus: 'active' as const,
  };

  it('should render results chart with vote counts', () => {
    render(<ResultsChart {...defaultProps} />);

    expect(screen.getByText('Current Results')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument(); // Total votes
    expect(screen.getByText('Total Votes')).toBeInTheDocument();
    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
  });

  it('should display correct percentages', () => {
    render(<ResultsChart {...defaultProps} />);

    expect(screen.getByText('30')).toBeInTheDocument(); // Option A votes
    expect(screen.getByText('20')).toBeInTheDocument(); // Option B votes
    expect(screen.getByText('60%')).toBeInTheDocument(); // Option A percentage
    expect(screen.getByText('40%')).toBeInTheDocument(); // Option B percentage
  });

  it('should show "Final Results" for closed polls', () => {
    render(<ResultsChart {...defaultProps} pollStatus="closed" />);

    expect(screen.getByText('Final Results')).toBeInTheDocument();
  });

  it('should show "Current Results" for active polls', () => {
    render(<ResultsChart {...defaultProps} pollStatus="active" />);

    expect(screen.getByText('Current Results')).toBeInTheDocument();
  });

  it('should handle zero votes', () => {
    render(
      <ResultsChart
        {...defaultProps}
        voteCounts={{ option_a: 0, option_b: 0 }}
      />
    );

    expect(screen.getByText('0')).toBeInTheDocument(); // Total votes
    expect(screen.getByText('0%')).toBeInTheDocument(); // Both percentages
  });

  it('should handle single vote', () => {
    render(
      <ResultsChart
        {...defaultProps}
        voteCounts={{ option_a: 1, option_b: 0 }}
      />
    );

    expect(screen.getByText('1')).toBeInTheDocument(); // Total votes
    expect(screen.getByText('100%')).toBeInTheDocument(); // Option A percentage
    expect(screen.getByText('0%')).toBeInTheDocument(); // Option B percentage
  });

  it('should apply custom className', () => {
    render(<ResultsChart {...defaultProps} className="custom-class" />);

    const container = screen
      .getByText('Current Results')
      .closest('div')?.parentElement;
    expect(container).toHaveClass('custom-class');
  });

  it('should display option labels correctly', () => {
    render(
      <ResultsChart
        {...defaultProps}
        optionLabels={{ option_a: 'Pizza', option_b: 'Burger' }}
      />
    );

    expect(screen.getByText('Pizza')).toBeInTheDocument();
    expect(screen.getByText('Burger')).toBeInTheDocument();
  });

  it('should show results summary with correct colors', () => {
    render(<ResultsChart {...defaultProps} />);

    // Check for the summary section with colored vote counts
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  it('should handle large vote counts', () => {
    render(
      <ResultsChart
        {...defaultProps}
        voteCounts={{ option_a: 1000, option_b: 2000 }}
      />
    );

    expect(screen.getByText('3000')).toBeInTheDocument(); // Total votes
    expect(screen.getByText('33%')).toBeInTheDocument(); // Option A percentage
    expect(screen.getByText('67%')).toBeInTheDocument(); // Option B percentage
  });
});
