import { Suspense } from 'react';
import PollFeed from '@/components/feed/PollFeed';
import LoadingSpinner from '@/components/layout/LoadingSpinner';

export default function TrendingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<LoadingSpinner text="Loading trending polls..." />}>
        <PollFeed feedType="trending" />
      </Suspense>
    </div>
  );
}
