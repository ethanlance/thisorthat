import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ReactNode } from 'react';

// Mock the Supabase client
const mockSupabase = {
  auth: {
    getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
    signInWithOAuth: vi.fn(() => Promise.resolve({ data: {}, error: null })),
    signOut: vi.fn(() => Promise.resolve({ error: null })),
  },
};

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

// Mock the AuthContext
const { AuthProvider, useAuth } = await import('@/contexts/AuthContext');

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide initial auth state', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it('should handle sign in', async () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signIn('google');
    });

    expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  });

  it('should handle sign out', async () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
  });

  it('should throw error when used outside provider', () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');
  });
});
