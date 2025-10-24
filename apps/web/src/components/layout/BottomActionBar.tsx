'use client';

import Link from 'next/link';
import { Eye, Plus, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export default function BottomActionBar() {
  const { user } = useAuth();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-t md:hidden">
      <div className="flex items-center justify-around px-4 py-2">
        {/* Browse */}
        <Link href="/polls">
          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col items-center space-y-1 h-12 w-16"
          >
            <Eye className="h-5 w-5" />
            <span className="text-xs">Browse</span>
          </Button>
        </Link>

        {/* Create - Large center button */}
        {user ? (
          <Link href="/poll/create">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary-dark h-14 w-14 rounded-full flex flex-col items-center justify-center space-y-1 shadow-lg"
            >
              <Plus className="h-6 w-6" />
              <span className="text-xs font-medium">Create</span>
            </Button>
          </Link>
        ) : (
          <Link href="/login">
            <Button
              size="lg"
              variant="outline"
              className="h-14 w-14 rounded-full flex flex-col items-center justify-center space-y-1 shadow-lg"
            >
              <Plus className="h-6 w-6" />
              <span className="text-xs font-medium">Create</span>
            </Button>
          </Link>
        )}

        {/* Profile */}
        {user ? (
          <Link href="/profile">
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center space-y-1 h-12 w-16"
            >
              <User className="h-5 w-5" />
              <span className="text-xs">Profile</span>
            </Button>
          </Link>
        ) : (
          <Link href="/login">
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center space-y-1 h-12 w-16"
            >
              <User className="h-5 w-5" />
              <span className="text-xs">Sign In</span>
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
