'use client';

import Link from 'next/link';
import { User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import MobileNav from './MobileNav';

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-primary">ThisOrThat</h1>
          </div>

          {/* Desktop Navigation - Simplified */}
          <nav className="hidden md:flex items-center space-x-4">
            <Link
              href="/polls"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Browse
            </Link>
            {user ? (
              <Link href="/poll/create">
                <Button size="sm" className="bg-primary hover:bg-primary-dark">
                  Create
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
            )}
            {user && (
              <Link
                href="/profile"
                className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <User className="h-4 w-4" />
                <span className="hidden lg:inline">
                  {user.user_metadata?.full_name || user.email}
                </span>
              </Link>
            )}
          </nav>

          {/* Mobile Navigation */}
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
