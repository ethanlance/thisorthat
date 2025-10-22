'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Grid, List } from 'lucide-react';
import { UserPollSummary } from '@/lib/services/dashboard';
import { getPollStatus } from '@/lib/services/expiration';
import PollCard from '@/components/poll/PollCard';
import { cn } from '@/lib/utils';

interface PollListProps {
  polls: UserPollSummary[];
  loading?: boolean;
  onDelete?: (pollId: string) => void;
  onShare?: (pollId: string) => void;
  onView?: (pollId: string) => void;
  className?: string;
}

type FilterStatus = 'all' | 'active' | 'closed' | 'deleted';
type ViewMode = 'grid' | 'list';

export default function PollList({
  polls,
  loading = false,
  onDelete,
  onShare,
  onView,
  className,
}: PollListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Filter and search polls
  const filteredPolls = useMemo(() => {
    let filtered = polls;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(poll => {
        const pollStatus = getPollStatus(poll);
        return pollStatus === statusFilter;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        poll =>
          poll.description?.toLowerCase().includes(query) ||
          poll.option_a_label?.toLowerCase().includes(query) ||
          poll.option_b_label?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [polls, statusFilter, searchQuery]);

  // Get status counts for filter badges
  const statusCounts = useMemo(() => {
    const counts = { all: 0, active: 0, closed: 0, deleted: 0 };

    polls.forEach(poll => {
      counts.all++;
      const status = getPollStatus(poll);
      counts[status]++;
    });

    return counts;
  }, [polls]);

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search polls by description or options..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters and View Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Status Filters */}
          <div className="flex flex-wrap gap-2">
            {(['all', 'active', 'closed', 'deleted'] as FilterStatus[]).map(
              status => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className="capitalize"
                >
                  {status}
                  {statusCounts[status] > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {statusCounts[status]}
                    </Badge>
                  )}
                </Button>
              )
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">View:</span>
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {filteredPolls.length} of {polls.length} polls
          {searchQuery && ` matching "${searchQuery}"`}
        </span>
        {statusFilter !== 'all' && <span>Filtered by: {statusFilter}</span>}
      </div>

      {/* Polls Grid/List */}
      {filteredPolls.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {polls.length === 0 ? (
              <>
                <p className="text-lg font-medium mb-2">No polls yet</p>
                <p>Create your first poll to get started!</p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium mb-2">No polls found</p>
                <p>Try adjusting your search or filters.</p>
              </>
            )}
          </div>
          {polls.length === 0 && (
            <Button onClick={() => (window.location.href = '/poll/create')}>
              Create Your First Poll
            </Button>
          )}
        </div>
      ) : (
        <div
          className={cn(
            'gap-4',
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              : 'space-y-4'
          )}
        >
          {filteredPolls.map(poll => (
            <PollCard
              key={poll.id}
              poll={poll}
              onDelete={onDelete}
              onShare={onShare}
              onView={onView}
              className={viewMode === 'list' ? 'max-w-none' : ''}
            />
          ))}
        </div>
      )}
    </div>
  );
}
