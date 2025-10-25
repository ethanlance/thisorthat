import { Suspense } from 'react';
import ProfileEditor from '@/components/profile/ProfileEditor';
import LoadingSpinner from '@/components/layout/LoadingSpinner';

export default function ProfilePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<LoadingSpinner text="Loading profile editor..." />}>
        <ProfileEditor />
      </Suspense>
    </div>
  );
}