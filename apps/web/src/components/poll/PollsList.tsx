'use client';

import { useState, useEffect } from 'react';
import { PollWithResults } from '@/lib/services/polls';
import { PollsService } from '@/lib/services/polls';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Clock, Eye } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface PollsListProps {
  className?: string;
}

export function PollsList({ className }: PollsListProps) {
  const [polls, setPolls] = useState<PollWithResults[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'closed'>('active');

  useEffect(() => {
    loadPolls();
  }, [activeTab]);

  const loadPolls = async () => {
    try {
      setLoading(true);
      setError(null);

      const pollsData = await PollsService.getPollsByStatus(activeTab);
      setPolls(pollsData);
    } catch (err) {
      console.error('Error loading polls:', err);
      setError('Failed to load polls. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPollStatus = (poll: PollWithResults) => {
    const now = new Date();
    const expiresAt = new Date(poll.expires_at);

    if (poll.status === 'closed' || expiresAt <= now) {
      return 'closed';
    }
    return 'active';
  };

  const getTimeRemaining = (poll: PollWithResults) => {
    const now = new Date();
    const expiresAt = new Date(poll.expires_at);

    if (expiresAt <= now) {
      return 'Closed';
    }

    return `Closes ${formatDistanceToNow(expiresAt, { addSuffix: true })}`;
  };

  const getVotePercentage = (votes: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading polls...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={loadPolls} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (polls.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">No polls found</h3>
            <p className="text-muted-foreground">
              {activeTab === 'active'
                ? 'There are no active polls at the moment. Check back later or create your own!'
                : 'No closed polls to display.'}
            </p>
          </div>
          {activeTab === 'active' && (
            <Link href="/poll/create">
              <Button>Create Your First Poll</Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      <Tabs
        value={activeTab}
        onValueChange={value => setActiveTab(value as 'active' | 'closed')}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">Active Polls</TabsTrigger>
          <TabsTrigger value="closed">Closed Polls</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {polls.map(poll => (
              <PollCard key={poll.id} poll={poll} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="closed" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {polls.map(poll => (
              <PollCard key={poll.id} poll={poll} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface PollCardProps {
  poll: PollWithResults;
}

function PollCard({ poll }: PollCardProps) {
  const totalVotes = poll.vote_counts.option_a + poll.vote_counts.option_b;
  const optionAPercentage = getVotePercentage(
    poll.vote_counts.option_a,
    totalVotes
  );
  const optionBPercentage = getVotePercentage(
    poll.vote_counts.option_b,
    totalVotes
  );
  const isActive = getPollStatus(poll) === 'active';

  return (
    <Link href={`/poll/${poll.id}`}>
      <Card className="group hover:shadow-md transition-all duration-200 cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Badge variant={isActive ? 'default' : 'secondary'}>
              {isActive ? 'Active' : 'Closed'}
            </Badge>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-1" />
              {getTimeRemaining(poll)}
            </div>
          </div>

          {poll.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
              {poll.description}
            </p>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          {/* Poll Images */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="text-center">
              <div className="relative">
                <Image
                  src={poll.option_a_image_url}
                  alt={poll.option_a_label || 'Option A'}
                  width={200}
                  height={120}
                  className="w-full h-20 object-cover rounded-lg border"
                />
                {!isActive && totalVotes > 0 && (
                  <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-medium">
                      {optionAPercentage}%
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs font-medium mt-1 line-clamp-1">
                {poll.option_a_label || 'Option A'}
              </p>
            </div>

            <div className="text-center">
              <div className="relative">
                <Image
                  src={poll.option_b_image_url}
                  alt={poll.option_b_label || 'Option B'}
                  width={200}
                  height={120}
                  className="w-full h-20 object-cover rounded-lg border"
                />
                {!isActive && totalVotes > 0 && (
                  <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-medium">
                      {optionBPercentage}%
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs font-medium mt-1 line-clamp-1">
                {poll.option_b_label || 'Option B'}
              </p>
            </div>
          </div>

          {/* Poll Stats */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{totalVotes} votes</span>
              </div>
            </div>

            {/* Vote Results Bar */}
            {!isActive && totalVotes > 0 && (
              <div className="w-full bg-muted rounded-full h-2">
                <div className="flex h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500"
                    style={{ width: `${optionAPercentage}%` }}
                  />
                  <div
                    className="bg-red-500"
                    style={{ width: `${optionBPercentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
            >
              <Eye className="h-3 w-3 mr-1" />
              {isActive ? 'Vote Now' : 'View Results'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function getPollStatus(poll: PollWithResults) {
  const now = new Date();
  const expiresAt = new Date(poll.expires_at);

  if (poll.status === 'closed' || expiresAt <= now) {
    return 'closed';
  }
  return 'active';
}

function getTimeRemaining(poll: PollWithResults) {
  const now = new Date();
  const expiresAt = new Date(poll.expires_at);

  if (expiresAt <= now) {
    return 'Closed';
  }

  return `Closes ${formatDistanceToNow(expiresAt, { addSuffix: true })}`;
}

function getVotePercentage(votes: number, total: number) {
  if (total === 0) return 0;
  return Math.round((votes / total) * 100);
}
