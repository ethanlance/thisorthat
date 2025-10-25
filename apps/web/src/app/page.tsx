import { Suspense } from 'react';
import { PollsService } from '@/lib/services/polls';
import HomePollCard from '@/components/poll/HomePollCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import BottomActionBar from '@/components/layout/BottomActionBar';

// Revalidate page every hour to show fresh polls
export const revalidate = 3600;

function HomePollSkeleton() {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <Skeleton className="h-8 w-64 mx-auto" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

async function FeaturedPoll() {
  try {
    const poll = await PollsService.getFeaturedPoll();

    if (!poll) {
      return (
        <div className="flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-4 text-center">
            <Alert>
              <AlertDescription>
                No polls available yet. Be the first to create one!
              </AlertDescription>
            </Alert>
            <Button asChild size="lg" className="w-full">
              <Link href="/poll/create">Create Your First Poll</Link>
            </Button>
          </div>
        </div>
      );
    }

    return <HomePollCard initialPoll={poll} />;
  } catch (error) {
    console.error('Error loading featured poll:', error);
    return (
      <div className="flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-4 text-center">
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load poll. Please try again later.
            </AlertDescription>
          </Alert>
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link href="/polls">Browse All Polls</Link>
          </Button>
        </div>
      </div>
    );
  }
}

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Skip link for keyboard navigation */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Header />
      <main
        id="main-content"
        className="flex-1 container mx-auto px-4 py-6 md:py-8 pb-20 md:pb-8"
        tabIndex={-1}
      >
        <div className="max-w-4xl mx-auto">
          <Suspense fallback={<HomePollSkeleton />}>
            <FeaturedPoll />
          </Suspense>
        </div>
      </main>
      <Footer />
      <BottomActionBar />
    </div>
  );
}
