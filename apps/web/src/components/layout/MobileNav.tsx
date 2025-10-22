'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Menu,
  X,
  Home,
  BarChart3,
  User,
  LogOut,
  Plus,
  Info,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsOpen(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMenu}
        className="md:hidden"
        aria-label="Toggle mobile menu"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={closeMenu}
            aria-hidden="true"
          />

          {/* Menu panel */}
          <div className="fixed right-0 top-0 h-full w-80 max-w-[85vw] bg-background border-l shadow-lg">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">Menu</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeMenu}
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Navigation links */}
              <nav className="flex-1 p-4 space-y-2">
                <Link
                  href="/"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
                  onClick={closeMenu}
                >
                  <Home className="h-5 w-5" />
                  <span>Home</span>
                </Link>

                <Link
                  href="/polls"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
                  onClick={closeMenu}
                >
                  <BarChart3 className="h-5 w-5" />
                  <span>Browse Polls</span>
                </Link>

                <Link
                  href="/about"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
                  onClick={closeMenu}
                >
                  <Info className="h-5 w-5" />
                  <span>About</span>
                </Link>

                {user && (
                  <>
                    <Link
                      href="/poll/create"
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
                      onClick={closeMenu}
                    >
                      <Plus className="h-5 w-5" />
                      <span>Create Poll</span>
                    </Link>

                    <Link
                      href="/profile"
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
                      onClick={closeMenu}
                    >
                      <User className="h-5 w-5" />
                      <span>Profile</span>
                    </Link>
                  </>
                )}
              </nav>

              {/* User section */}
              <div className="p-4 border-t">
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 px-3 py-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user.user_metadata?.full_name || user.email}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={handleSignOut}
                      className="w-full justify-start"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <Link href="/login" onClick={closeMenu}>
                    <Button className="w-full">Sign In</Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
