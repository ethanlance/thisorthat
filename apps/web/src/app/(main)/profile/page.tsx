'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Calendar, LogOut } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user && !loading) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Your Profile</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="bg-card rounded-lg border p-6 space-y-6">
        {/* User Avatar and Basic Info */}
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="Profile"
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <User className="h-8 w-8 text-primary" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold">
              {user.user_metadata?.full_name || 'User'}
            </h2>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>

        {/* User Details */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{user.email}</span>
          </div>

          <div className="flex items-center space-x-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              Joined {new Date(user.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Account Actions */}
        <div className="pt-4 border-t">
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-2 px-4 py-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Future: User's Polls */}
      <div className="bg-card rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Your Polls</h3>
        <p className="text-muted-foreground">
          Polls you've created will appear here. Start by{' '}
          <a href="/poll/create" className="text-primary hover:underline">
            creating your first poll
          </a>
          .
        </p>
      </div>
    </div>
  );
}
