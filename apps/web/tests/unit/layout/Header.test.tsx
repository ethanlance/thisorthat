import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Header from '@/components/layout/Header';
import { AuthProvider } from '@/contexts/AuthContext';

// Mock the Supabase client
const mockSupabase = {
  auth: {
    getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
  },
};

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('Header Component', () => {
  const renderWithAuth = (children: React.ReactNode) => {
    return render(<AuthProvider>{children}</AuthProvider>);
  };

  it('renders the ThisOrThat logo', () => {
    renderWithAuth(<Header />);
    expect(screen.getByText('ThisOrThat')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    renderWithAuth(<Header />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Polls')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('renders mobile menu button', () => {
    renderWithAuth(<Header />);
    const menuButton = screen.getByLabelText('Toggle mobile menu');
    expect(menuButton).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    renderWithAuth(<Header />);
    const menuButton = screen.getByLabelText('Toggle mobile menu');
    expect(menuButton).toHaveAttribute('aria-label', 'Toggle mobile menu');
  });
});
