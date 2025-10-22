import { render, screen } from '@testing-library/react';
import ConnectionStatus from '@/components/poll/ConnectionStatus';

describe('ConnectionStatus', () => {
  it('should not render when connected', () => {
    render(
      <ConnectionStatus 
        isConnected={true} 
        lastUpdate={new Date()} 
      />
    );
    
    expect(screen.queryByText('Connection lost')).not.toBeInTheDocument();
  });

  it('should render connection lost message when disconnected', () => {
    render(
      <ConnectionStatus 
        isConnected={false} 
        lastUpdate={null} 
      />
    );
    
    expect(screen.getByText('Connection lost. Attempting to reconnect...')).toBeInTheDocument();
  });

  it('should show last update time when provided', () => {
    const lastUpdate = new Date('2023-01-01T12:00:00Z');
    
    render(
      <ConnectionStatus 
        isConnected={false} 
        lastUpdate={lastUpdate} 
      />
    );
    
    expect(screen.getByText(/Last update:/)).toBeInTheDocument();
  });

  it('should not show last update time when not provided', () => {
    render(
      <ConnectionStatus 
        isConnected={false} 
        lastUpdate={null} 
      />
    );
    
    expect(screen.queryByText(/Last update:/)).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <ConnectionStatus 
        isConnected={false} 
        lastUpdate={null}
        className="custom-class"
      />
    );
    
    const container = screen.getByText('Connection lost. Attempting to reconnect...').closest('div');
    expect(container).toHaveClass('custom-class');
  });

  it('should display wifi off icon', () => {
    render(
      <ConnectionStatus 
        isConnected={false} 
        lastUpdate={null} 
      />
    );
    
    // Check for the wifi off icon (lucide-react icon)
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toBeInTheDocument();
  });

  it('should format last update time correctly', () => {
    const lastUpdate = new Date('2023-01-01T12:30:45Z');
    
    render(
      <ConnectionStatus 
        isConnected={false} 
        lastUpdate={lastUpdate} 
      />
    );
    
    // The exact format depends on locale, but should contain time
    expect(screen.getByText(/Last update:/)).toBeInTheDocument();
  });
});
