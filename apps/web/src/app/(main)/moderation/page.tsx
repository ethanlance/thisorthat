import { Suspense } from 'react';
import ModerationDashboard from '@/components/moderation/ModerationDashboard';
import LoadingSpinner from '@/components/layout/LoadingSpinner';

export default function ModerationPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense
        fallback={<LoadingSpinner text="Loading moderation dashboard..." />}
      >
        <ModerationDashboard />
      </Suspense>
    </div>
  );
}
