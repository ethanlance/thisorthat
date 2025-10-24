import { Suspense } from 'react';
import { UserProfile } from '@/components/profile/UserProfile';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { notFound } from 'next/navigation';

interface UserPageProps {
  params: {
    userId: string;
  };
}

export default function UserPage({ params }: UserPageProps) {
  const { userId } = params;

  if (!userId) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Suspense fallback={<LoadingSpinner />}>
          <UserProfile userId={userId} />
        </Suspense>
      </div>
    </div>
  );
}
