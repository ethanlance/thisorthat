'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface OAuthButtonProps {
  provider: 'google';
  children: React.ReactNode;
  className?: string;
}

export default function OAuthButton({ provider, children, className = '' }: OAuthButtonProps) {
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSignIn = async () => {
    try {
      setLoading(true);
      await signIn(provider);
    } catch (error) {
      console.error(`${provider} sign in error:`, error);
      // You could add a toast notification here
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSignIn}
      disabled={loading}
      className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        children
      )}
    </button>
  );
}
