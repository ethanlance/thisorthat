import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OAuthButton from '@/components/auth/OAuthButton';

// Mock the AuthContext
const mockSignIn = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
  }),
}));

describe('OAuthButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with children', () => {
    render(
      <OAuthButton provider="google">
        <span>Test Button</span>
      </OAuthButton>
    );

    expect(screen.getByText('Test Button')).toBeInTheDocument();
  });

  it('should call signIn with correct provider on click', async () => {
    render(
      <OAuthButton provider="google">
        <span>Test Button</span>
      </OAuthButton>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('google');
    });
  });

  it('should show loading state during sign in', async () => {
    mockSignIn.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <OAuthButton provider="google">
        <span>Test Button</span>
      </OAuthButton>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toBeDisabled();
    });
  });

  it('should handle sign in errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockSignIn.mockRejectedValue(new Error('Sign in failed'));

    render(
      <OAuthButton provider="google">
        <span>Test Button</span>
      </OAuthButton>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'google sign in error:',
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });
});
