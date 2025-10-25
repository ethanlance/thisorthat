'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  Flag,
  CheckCircle,
  Clock,
  Users,
  BarChart3,
  Loader2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface ModerationStatsData {
  total_reports: number;
  pending_reports: number;
  resolved_reports: number;
  total_actions: number;
  appeals_pending: number;
}

interface DetectionStatsData {
  totalScans: number;
  safeContent: number;
  inappropriateContent: number;
  spamContent: number;
  humanReviewRequired: number;
}

export default function ModerationStats() {
  const [moderationStats, setModerationStats] =
    useState<ModerationStatsData | null>(null);
  const [detectionStats, setDetectionStats] =
    useState<DetectionStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load moderation stats
      const moderationResponse = await fetch('/api/moderation/stats');
      if (moderationResponse.ok) {
        const moderationData = await moderationResponse.json();
        setModerationStats(moderationData);
      }

      // Load detection stats
      const detectionResponse = await fetch('/api/moderation/detection-stats');
      if (detectionResponse.ok) {
        const detectionData = await detectionResponse.json();
        setDetectionStats(detectionData);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
      setError('Failed to load moderation statistics');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) {
      return <TrendingUp className="h-3 w-3 text-red-500" />;
    } else if (current < previous) {
      return <TrendingDown className="h-3 w-3 text-green-500" />;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading statistics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Moderation Statistics</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Overview of content moderation and detection metrics
          </p>
        </div>
        <Button onClick={loadStats} variant="outline" size="sm">
          <BarChart3 className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Moderation Stats */}
      {moderationStats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Flag className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Total Reports</p>
                  <p className="text-2xl font-bold">
                    {moderationStats.total_reports}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium">Pending</p>
                  <p className="text-2xl font-bold">
                    {moderationStats.pending_reports}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Resolved</p>
                  <p className="text-2xl font-bold">
                    {moderationStats.resolved_reports}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">Actions</p>
                  <p className="text-2xl font-bold">
                    {moderationStats.total_actions}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">Appeals</p>
                  <p className="text-2xl font-bold">
                    {moderationStats.appeals_pending}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detection Stats */}
      {detectionStats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Total Scans</p>
                  <p className="text-2xl font-bold">
                    {detectionStats.totalScans}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Safe Content</p>
                  <p className="text-2xl font-bold">
                    {detectionStats.safeContent}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-sm font-medium">Inappropriate</p>
                  <p className="text-2xl font-bold">
                    {detectionStats.inappropriateContent}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium">Spam</p>
                  <p className="text-2xl font-bold">
                    {detectionStats.spamContent}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">Human Review</p>
                  <p className="text-2xl font-bold">
                    {detectionStats.humanReviewRequired}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Content Detection Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {detectionStats && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Detection Rate</span>
                  <span className="font-medium">
                    {detectionStats.totalScans > 0
                      ? Math.round(
                          ((detectionStats.inappropriateContent +
                            detectionStats.spamContent) /
                            detectionStats.totalScans) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">False Positive Rate</span>
                  <span className="font-medium">
                    {detectionStats.totalScans > 0
                      ? Math.round(
                          (detectionStats.humanReviewRequired /
                            detectionStats.totalScans) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Automation Rate</span>
                  <span className="font-medium">
                    {detectionStats.totalScans > 0
                      ? Math.round(
                          ((detectionStats.totalScans -
                            detectionStats.humanReviewRequired) /
                            detectionStats.totalScans) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Moderation Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            {moderationStats && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Resolution Rate</span>
                  <span className="font-medium">
                    {moderationStats.total_reports > 0
                      ? Math.round(
                          (moderationStats.resolved_reports /
                            moderationStats.total_reports) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Pending Rate</span>
                  <span className="font-medium">
                    {moderationStats.total_reports > 0
                      ? Math.round(
                          (moderationStats.pending_reports /
                            moderationStats.total_reports) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Actions per Report</span>
                  <span className="font-medium">
                    {moderationStats.total_reports > 0
                      ? (
                          moderationStats.total_actions /
                          moderationStats.total_reports
                        ).toFixed(1)
                      : 0}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
