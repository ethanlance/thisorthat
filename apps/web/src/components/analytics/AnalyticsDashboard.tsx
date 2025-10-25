'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Activity,
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointer,
  Share2,
  MessageSquare,
  Clock,
  BarChart3,
  PieChart,
  LineChart,
  Calendar,
  Download,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { AnalyticsService, BusinessMetrics, PollAnalytics, UserAnalytics } from '@/lib/analytics/AnalyticsService';

interface AnalyticsDashboardProps {
  className?: string;
}

export default function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics | null>(null);
  const [pollAnalytics, setPollAnalytics] = useState<PollAnalytics[]>([]);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  const analyticsService = AnalyticsService.getInstance();

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [businessData, pollsData, usersData] = await Promise.all([
        analyticsService.getBusinessMetrics(),
        fetch('/api/analytics/polls').then(res => res.json()),
        fetch('/api/analytics/users').then(res => res.json()),
      ]);

      setBusinessMetrics(businessData);
      setPollAnalytics(pollsData.analytics || []);
      setUserAnalytics(usersData.analytics || []);
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Analytics loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatPercentage = (num: number): string => {
    return `${num.toFixed(1)}%`;
  };

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadAnalyticsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <div className="flex items-center space-x-2">
            <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
              <TabsList>
                <TabsTrigger value="7d">7 Days</TabsTrigger>
                <TabsTrigger value="30d">30 Days</TabsTrigger>
                <TabsTrigger value="90d">90 Days</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" onClick={loadAnalyticsData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="polls">Polls</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          {businessMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Daily Active Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(businessMetrics.dailyActiveUsers)}</div>
                  <p className="text-xs text-muted-foreground">
                    +12% from last week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Polls</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(businessMetrics.totalPolls)}</div>
                  <p className="text-xs text-muted-foreground">
                    +8% from last week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatPercentage(businessMetrics.engagementRate)}</div>
                  <p className="text-xs text-muted-foreground">
                    +5% from last week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Session Duration</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatDuration(businessMetrics.averageSessionDuration)}</div>
                  <p className="text-xs text-muted-foreground">
                    +2% from last week
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* User Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <LineChart className="h-12 w-12 mx-auto mb-4" />
                  <p>User growth chart would be displayed here</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Performing Polls */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Polls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pollAnalytics.slice(0, 5).map((poll, index) => (
                  <div key={poll.pollId} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">Poll {poll.pollId.slice(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">
                          {poll.views} views • {poll.votes} votes
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        {formatPercentage(poll.engagementScore)}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          {/* User Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(businessMetrics?.totalUsers || 0)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">New Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(businessMetrics?.newUsers || 0)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Retention Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercentage(businessMetrics?.userRetentionRate || 0)}</div>
              </CardContent>
            </Card>
          </div>

          {/* User Engagement */}
          <Card>
            <CardHeader>
              <CardTitle>User Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">High Engagement Users</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={75} className="w-32" />
                    <span className="text-sm font-medium">75%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Active Users</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={60} className="w-32" />
                    <span className="text-sm font-medium">60%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Returning Users</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={45} className="w-32" />
                    <span className="text-sm font-medium">45%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="polls" className="space-y-6">
          {/* Poll Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Polls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(businessMetrics?.totalPolls || 0)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Votes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(businessMetrics?.totalVotes || 0)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Shares</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(businessMetrics?.totalShares || 0)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Avg Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercentage(businessMetrics?.engagementRate || 0)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Poll Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Poll Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pollAnalytics.map((poll) => (
                  <div key={poll.pollId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        <BarChart3 className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-medium">Poll {poll.pollId.slice(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">
                          {poll.views} views • {poll.votes} votes • {poll.shares} shares
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatPercentage(poll.engagementScore)}</p>
                        <p className="text-xs text-muted-foreground">Engagement</p>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          {/* Engagement Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>User Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4" />
                      <span className="text-sm">Page Views</span>
                    </div>
                    <span className="font-medium">12.5K</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MousePointer className="h-4 w-4" />
                      <span className="text-sm">Clicks</span>
                    </div>
                    <span className="font-medium">8.2K</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Share2 className="h-4 w-4" />
                      <span className="text-sm">Shares</span>
                    </div>
                    <span className="font-medium">1.8K</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4" />
                      <span className="text-sm">Comments</span>
                    </div>
                    <span className="font-medium">456</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 mx-auto mb-4" />
                    <p>Engagement trends chart would be displayed here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
