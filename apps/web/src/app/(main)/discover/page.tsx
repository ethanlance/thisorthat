import { Suspense } from 'react';
import PollFeed from '@/components/feed/PollFeed';
import PollSearch from '@/components/feed/PollSearch';
import TrendingPolls from '@/components/feed/TrendingPolls';
import LoadingSpinner from '@/components/layout/LoadingSpinner';

export default function DiscoverPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <Suspense
            fallback={<LoadingSpinner text="Loading personalized feed..." />}
          >
            <PollFeed feedType="personalized" />
          </Suspense>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <Suspense fallback={<LoadingSpinner text="Loading search..." />}>
            <PollSearch />
          </Suspense>

          <Suspense
            fallback={<LoadingSpinner text="Loading trending polls..." />}
          >
            <TrendingPolls limit={5} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
