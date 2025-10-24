import { Suspense } from 'react';
import { UserSearch } from '@/components/profile/UserSearch';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Users, Search } from 'lucide-react';

export default function UsersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Discover Users</h1>
          </div>
          <p className="text-muted-foreground">
            Find and connect with other users on the platform
          </p>
        </div>
        
        <div className="space-y-6">
          <Suspense fallback={<LoadingSpinner />}>
            <UserSearch 
              onUserSelect={(user) => {
                // Navigate to user profile
                window.location.href = `/users/${user.id}`;
              }}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
