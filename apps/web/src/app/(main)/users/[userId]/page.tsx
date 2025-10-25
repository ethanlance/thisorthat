import { Suspense } from 'react';
import UserProfile from '@/components/profile/UserProfile';
import LoadingSpinner from '@/components/layout/LoadingSpinner';

interface UserProfilePageProps {
  params: Promise<{
    userId: string;
  }>;
}

export default async function UserProfilePage({
  params,
}: UserProfilePageProps) {
  const { userId } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<LoadingSpinner text="Loading user profile..." />}>
        <UserProfile userId={userId} />
      </Suspense>
    </div>
  );
}
