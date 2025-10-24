import { Suspense } from 'react';
import FriendGroupManager from '@/components/privacy/FriendGroupManager';
import LoadingSpinner from '@/components/layout/LoadingSpinner';

export default function FriendGroupsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<LoadingSpinner text="Loading friend groups..." />}>
        <FriendGroupManager />
      </Suspense>
    </div>
  );
}
