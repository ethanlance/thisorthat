'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface HistoricalPoll {
  id: string;
  description: string;
  option_a_label: string;
  option_b_label: string;
  vote_counts: { option_a: number; option_b: number };
  created_at: string;
  status: 'closed';
}

interface HistoricalResultsProps {
  limit?: number;
  className?: string;
}

export default function HistoricalResults({
  limit = 10,
  className,
}: HistoricalResultsProps) {
  const [polls, setPolls] = useState<HistoricalPoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistoricalPolls = async () => {
      try {
        const supabase = createClient();

        const { data: pollsData, error: pollsError } = await supabase
          .from('polls')
          .select('*')
          .eq('status', 'closed')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (pollsError) {
          setError('Failed to fetch historical polls');
          return;
        }

        if (!pollsData) {
          setPolls([]);
          return;
        }

        // Fetch vote counts for each poll
        const pollsWithVotes = await Promise.all(
          pollsData.map(async poll => {
            const { data: votes } = await supabase
              .from('votes')
              .select('choice')
              .eq('poll_id', poll.id);

            const voteCounts = {
              option_a: votes?.filter(v => v.choice === 'option_a').length || 0,
              option_b: votes?.filter(v => v.choice === 'option_b').length || 0,
            };

            return {
              ...poll,
              vote_counts: voteCounts,
            };
          })
        );

        setPolls(pollsWithVotes);
      } catch {
        setError('Failed to fetch historical polls');
      } finally {
        setLoading(false);
      }
    };

    fetchHistoricalPolls();
  }, [limit]);

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        <h2 className="text-xl font-semibold">Historical Results</h2>
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('space-y-4', className)}>
        <h2 className="text-xl font-semibold">Historical Results</h2>
        <div className="text-center py-8">
          <p className="text-muted-foreground">{error}</p>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (polls.length === 0) {
    return (
      <div className={cn('space-y-4', className)}>
        <h2 className="text-xl font-semibold">Historical Results</h2>
        <div className="text-center py-8">
          <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No historical results yet</p>
          <p className="text-sm text-muted-foreground">
            Closed polls will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <h2 className="text-xl font-semibold">Historical Results</h2>

      <div className="grid gap-4">
        {polls.map(poll => {
          const totalVotes =
            poll.vote_counts.option_a + poll.vote_counts.option_b;
          const optionAPercentage =
            totalVotes > 0
              ? Math.round((poll.vote_counts.option_a / totalVotes) * 100)
              : 0;
          const optionBPercentage =
            totalVotes > 0
              ? Math.round((poll.vote_counts.option_b / totalVotes) * 100)
              : 0;

          return (
            <Card key={poll.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {poll.description}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        {new Date(poll.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Badge variant="secondary">Closed</Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  {/* Vote Count Summary */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{totalVotes} total votes</span>
                  </div>

                  {/* Results */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        {poll.option_a_label}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {poll.vote_counts.option_a} ({optionAPercentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${optionAPercentage}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        {poll.option_b_label}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {poll.vote_counts.option_b} ({optionBPercentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${optionBPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
