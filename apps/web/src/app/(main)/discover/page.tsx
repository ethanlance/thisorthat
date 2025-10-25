import { Suspense } from 'react';
import PollFeed from '@/components/feed/PollFeed';
import PollSearch from '@/components/feed/PollSearch';
import FeedPreferences from '@/components/feed/FeedPreferences';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingSpinner from '@/components/layout/LoadingSpinner';

export default function DiscoverPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Discover Polls</h1>
        <p className="text-muted-foreground">
          Find interesting polls, explore trending topics, and discover new
          content
        </p>
      </div>

      <Tabs defaultValue="feed" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="feed">Your Feed</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="mt-6">
          <Suspense fallback={<LoadingSpinner text="Loading your feed..." />}>
            <PollFeed feedType="personalized" />
          </Suspense>
        </TabsContent>

        <TabsContent value="search" className="mt-6">
          <Suspense fallback={<LoadingSpinner text="Loading search..." />}>
            <PollSearch />
          </Suspense>
        </TabsContent>

        <TabsContent value="trending" className="mt-6">
          <Suspense
            fallback={<LoadingSpinner text="Loading trending polls..." />}
          >
            <PollFeed feedType="trending" />
          </Suspense>
        </TabsContent>

        <TabsContent value="preferences" className="mt-6">
          <Suspense fallback={<LoadingSpinner text="Loading preferences..." />}>
            <FeedPreferences />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
