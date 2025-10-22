import { render, screen } from '@testing-library/react';
import AnimatedProgressBar from '@/components/poll/AnimatedProgressBar';

describe('AnimatedProgressBar', () => {
  it('should render with correct percentage', () => {
    render(
      <AnimatedProgressBar 
        value={30} 
        max={100} 
        color="bg-blue-500" 
      />
    );
    
    const progressBar = screen.getByRole('progressbar', { hidden: true });
    expect(progressBar).toBeInTheDocument();
  });

  it('should calculate correct percentage', () => {
    render(
      <AnimatedProgressBar 
        value={25} 
        max={100} 
        color="bg-blue-500" 
      />
    );
    
    const progressBar = screen.getByRole('progressbar', { hidden: true });
    const progressFill = progressBar.querySelector('div');
    expect(progressFill).toHaveStyle('width: 25%');
  });

  it('should handle zero max value', () => {
    render(
      <AnimatedProgressBar 
        value={10} 
        max={0} 
        color="bg-blue-500" 
      />
    );
    
    const progressBar = screen.getByRole('progressbar', { hidden: true });
    const progressFill = progressBar.querySelector('div');
    expect(progressFill).toHaveStyle('width: 0%');
  });

  it('should show percentage when enabled', () => {
    render(
      <AnimatedProgressBar 
        value={75} 
        max={100} 
        color="bg-blue-500" 
        showPercentage={true}
      />
    );
    
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('should not show percentage when disabled', () => {
    render(
      <AnimatedProgressBar 
        value={75} 
        max={100} 
        color="bg-blue-500" 
        showPercentage={false}
      />
    );
    
    expect(screen.queryByText('75%')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <AnimatedProgressBar 
        value={50} 
        max={100} 
        color="bg-blue-500" 
        className="custom-class"
      />
    );
    
    const progressBar = screen.getByRole('progressbar', { hidden: true });
    expect(progressBar).toHaveClass('custom-class');
  });

  it('should apply color class to progress fill', () => {
    render(
      <AnimatedProgressBar 
        value={50} 
        max={100} 
        color="bg-red-500" 
      />
    );
    
    const progressBar = screen.getByRole('progressbar', { hidden: true });
    const progressFill = progressBar.querySelector('div');
    expect(progressFill).toHaveClass('bg-red-500');
  });

  it('should round percentage correctly', () => {
    render(
      <AnimatedProgressBar 
        value={33} 
        max={100} 
        color="bg-blue-500" 
        showPercentage={true}
      />
    );
    
    expect(screen.getByText('33%')).toBeInTheDocument();
  });

  it('should handle edge case values', () => {
    render(
      <AnimatedProgressBar 
        value={0} 
        max={100} 
        color="bg-blue-500" 
      />
    );
    
    const progressBar = screen.getByRole('progressbar', { hidden: true });
    const progressFill = progressBar.querySelector('div');
    expect(progressFill).toHaveStyle('width: 0%');
  });
});
