import { Suspense } from 'react';
import { PollsList } from '@/components/poll/PollsList';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';

export default function PollsPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Browse Polls</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Discover polls created by the community. Vote on topics that interest you and see what others think.
        </p>
      </div>

      <Suspense fallback={<LoadingSpinner />}>
        <PollsList />
      </Suspense>
    </div>
  );
}
