import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MobileNav from '@/components/layout/MobileNav';
import { AuthProvider } from '@/contexts/AuthContext';

// Mock the auth context
const mockAuthContext = {
  user: null,
  session: null,
  loading: false,
  signIn: vi.fn(),
  signOut: vi.fn(),
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

describe('MobileNav Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders mobile menu button', () => {
    render(<MobileNav />);
    const menuButton = screen.getByLabelText('Toggle mobile menu');
    expect(menuButton).toBeInTheDocument();
  });

  it('opens mobile menu when button is clicked', () => {
    render(<MobileNav />);
    const menuButton = screen.getByLabelText('Toggle mobile menu');
    
    fireEvent.click(menuButton);
    
    expect(screen.getByText('Menu')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Browse Polls')).toBeInTheDocument();
  });

  it('closes mobile menu when close button is clicked', () => {
    render(<MobileNav />);
    const menuButton = screen.getByLabelText('Toggle mobile menu');
    
    // Open menu
    fireEvent.click(menuButton);
    expect(screen.getByText('Menu')).toBeInTheDocument();
    
    // Close menu
    const closeButton = screen.getByLabelText('Close menu');
    fireEvent.click(closeButton);
    
    expect(screen.queryByText('Menu')).not.toBeInTheDocument();
  });

  it('shows sign in button when user is not authenticated', () => {
    render(<MobileNav />);
    const menuButton = screen.getByLabelText('Toggle mobile menu');
    fireEvent.click(menuButton);
    
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('shows user info and sign out button when user is authenticated', () => {
    const authenticatedUser = {
      id: '1',
      email: 'test@example.com',
      user_metadata: { full_name: 'Test User' }
    };

    vi.mocked(mockAuthContext).user = authenticatedUser as any;

    render(<MobileNav />);
    const menuButton = screen.getByLabelText('Toggle mobile menu');
    fireEvent.click(menuButton);
    
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('shows create poll link when user is authenticated', () => {
    const authenticatedUser = {
      id: '1',
      email: 'test@example.com',
      user_metadata: { full_name: 'Test User' }
    };

    vi.mocked(mockAuthContext).user = authenticatedUser as any;

    render(<MobileNav />);
    const menuButton = screen.getByLabelText('Toggle mobile menu');
    fireEvent.click(menuButton);
    
    expect(screen.getByText('Create Poll')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('calls signOut when sign out button is clicked', () => {
    const authenticatedUser = {
      id: '1',
      email: 'test@example.com',
      user_metadata: { full_name: 'Test User' }
    };

    vi.mocked(mockAuthContext).user = authenticatedUser as any;

    render(<MobileNav />);
    const menuButton = screen.getByLabelText('Toggle mobile menu');
    fireEvent.click(menuButton);
    
    const signOutButton = screen.getByText('Sign Out');
    fireEvent.click(signOutButton);
    
    expect(mockAuthContext.signOut).toHaveBeenCalled();
  });

  it('closes menu when backdrop is clicked', () => {
    render(<MobileNav />);
    const menuButton = screen.getByLabelText('Toggle mobile menu');
    
    // Open menu
    fireEvent.click(menuButton);
    expect(screen.getByText('Menu')).toBeInTheDocument();
    
    // Click backdrop
    const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/50');
    if (backdrop) {
      fireEvent.click(backdrop);
    }
    
    expect(screen.queryByText('Menu')).not.toBeInTheDocument();
  });
});
