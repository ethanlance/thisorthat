import { Suspense } from 'react';
import UserProfile from '@/components/profile/UserProfile';
import LoadingSpinner from '@/components/layout/LoadingSpinner';

interface UserProfilePageProps {
  params: {
    userId: string;
  };
}

export default function UserProfilePage({ params }: UserProfilePageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<LoadingSpinner text="Loading user profile..." />}>
        <UserProfile userId={params.userId} />
      </Suspense>
    </div>
  );
}