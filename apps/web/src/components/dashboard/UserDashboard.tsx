'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  TrendingUp,
  Clock,
  Users,
  Share2,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPolls } from '@/lib/hooks/useUserPolls';
import { DashboardService, DashboardStats } from '@/lib/services/dashboard';
import { getPollStatus } from '@/lib/services/expiration';
import PollList from './PollList';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import ErrorDisplay from '@/components/ui/error-display';
import { cn } from '@/lib/utils';

interface UserDashboardProps {
  className?: string;
}

export default function UserDashboard({ className }: UserDashboardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(
    null
  );

  const {
    polls,
    loading: pollsLoading,
    error: pollsError,
    refetch: refetchPolls,
    deletePoll,
    sharePoll,
  } = useUserPolls(user?.id);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return;

      try {
        setStatsLoading(true);
        setStatsError(null);
        const dashboardStats = await DashboardService.getDashboardStats(
          user.id
        );
        setStats(dashboardStats);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to fetch dashboard stats';
        setStatsError(errorMessage);
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [user?.id]);

  // Get polls expiring soon
  const expiringSoonPolls = polls.filter(poll => {
    const status = getPollStatus(poll);
    if (status !== 'active') return false;

    const now = new Date();
    const expiresAt = new Date(poll.expires_at);
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    return expiresAt >= now && expiresAt <= oneHourFromNow;
  });

  const handleDeletePoll = async (pollId: string) => {
    try {
      await deletePoll(pollId);
      setShowSuccessMessage('Poll deleted successfully');
      setTimeout(() => setShowSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Failed to delete poll:', error);
    }
  };

  const handleSharePoll = async (pollId: string) => {
    try {
      await sharePoll(pollId);
      setShowSuccessMessage('Poll link copied to clipboard!');
      setTimeout(() => setShowSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Failed to share poll:', error);
    }
  };

  const handleViewPoll = (pollId: string) => {
    router.push(`/poll/${pollId}`);
  };

  const handleCreatePoll = () => {
    router.push('/poll/create');
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You must be logged in to view your dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={cn('max-w-6xl mx-auto px-4 py-6 space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Polls</h1>
          <p className="text-muted-foreground">Manage and track your polls</p>
        </div>
        <Button onClick={handleCreatePoll} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Poll
        </Button>
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
          <AlertDescription>{showSuccessMessage}</AlertDescription>
        </Alert>
      )}

      {/* Dashboard Stats */}
      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : statsError ? (
        <Alert variant="destructive">
          <AlertDescription>{statsError}</AlertDescription>
        </Alert>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Polls</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPolls}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activePolls} active, {stats.closedPolls} closed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVotes}</div>
              <p className="text-xs text-muted-foreground">
                {stats.averageVotesPerPoll} avg per poll
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Polls
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activePolls}</div>
              <p className="text-xs text-muted-foreground">
                Currently accepting votes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Expiring Soon
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {expiringSoonPolls.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Within the next hour
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Expiring Soon Alert */}
      {expiringSoonPolls.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have {expiringSoonPolls.length} poll
            {expiringSoonPolls.length > 1 ? 's' : ''} expiring within the next
            hour.
          </AlertDescription>
        </Alert>
      )}

      {/* Polls List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Polls</h2>
          {polls.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={refetchPolls}
              disabled={pollsLoading}
            >
              {pollsLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
          )}
        </div>

        {pollsError ? (
          <ErrorDisplay message={pollsError} onRetry={refetchPolls} />
        ) : (
          <PollList
            polls={polls}
            loading={pollsLoading}
            onDelete={handleDeletePoll}
            onShare={handleSharePoll}
            onView={handleViewPoll}
          />
        )}
      </div>
    </div>
  );
}
