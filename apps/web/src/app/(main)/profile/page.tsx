import { Suspense } from 'react';
import { ProfileEditor } from '@/components/profile/ProfileEditor';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';

export default function ProfilePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your profile information and preferences
          </p>
        </div>
        
        <Suspense fallback={<LoadingSpinner />}>
          <ProfileEditor />
        </Suspense>
      </div>
    </div>
  );
}