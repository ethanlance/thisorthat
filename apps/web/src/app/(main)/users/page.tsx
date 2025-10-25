import { Suspense } from 'react';
import UserSearch from '@/components/profile/UserSearch';
import LoadingSpinner from '@/components/layout/LoadingSpinner';

export default function UsersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<LoadingSpinner text="Loading user discovery..." />}>
        <UserSearch />
      </Suspense>
    </div>
  );
}
