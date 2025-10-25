'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Activity,
  Zap,
  Clock,
  Image as ImageIcon,
  Database,
  Wifi,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { usePerformanceMonitoring } from '@/lib/hooks/usePerformance';

interface PerformanceMonitorProps {
  showDetails?: boolean;
  className?: string;
}

export default function PerformanceMonitor({
  showDetails = false,
  className,
}: PerformanceMonitorProps) {
  const { metrics, score, report } = usePerformanceMonitoring();
  const [isExpanded, setIsExpanded] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const formatMetric = (value: number | undefined, unit: string = 'ms') => {
    if (value === undefined) return 'N/A';
    return `${Math.round(value)}${unit}`;
  };

  const getMetricStatus = (value: number | undefined, budget: number) => {
    if (value === undefined) return 'unknown';
    return value <= budget ? 'good' : 'poor';
  };

  const getMetricIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'poor':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getMetricTrend = (current: number | undefined, budget: number) => {
    if (current === undefined) return 'stable';
    const percentage = (current / budget) * 100;
    if (percentage <= 80) return 'good';
    if (percentage <= 100) return 'stable';
    return 'poor';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'good':
        return <TrendingDown className="h-3 w-3 text-green-600" />;
      case 'poor':
        return <TrendingUp className="h-3 w-3 text-red-600" />;
      default:
        return <Activity className="h-3 w-3 text-gray-400" />;
    }
  };

  if (!showDetails && score >= 90) {
    return null; // Don't show monitor if performance is good
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <CardTitle className="text-lg">Performance Monitor</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getScoreBadgeColor(score)}>
              Score: {score}/100
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Hide' : 'Show'} Details
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Performance Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Performance</span>
            <span className={`text-sm font-bold ${getScoreColor(score)}`}>
              {score}/100
            </span>
          </div>
          <Progress value={score} className="h-2" />
        </div>

        {/* Core Web Vitals */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Core Web Vitals</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* LCP */}
            <div className="flex items-center justify-between p-2 bg-muted rounded">
              <div className="flex items-center space-x-2">
                <ImageIcon className="h-4 w-4" />
                <span className="text-sm">LCP</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-mono">
                  {formatMetric(report.metrics.lcp)}
                </span>
                {getMetricIcon(
                  getMetricStatus(report.metrics.lcp, report.budget.lcp)
                )}
              </div>
            </div>

            {/* FID */}
            <div className="flex items-center justify-between p-2 bg-muted rounded">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span className="text-sm">FID</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-mono">
                  {formatMetric(report.metrics.fid)}
                </span>
                {getMetricIcon(
                  getMetricStatus(report.metrics.fid, report.budget.fid)
                )}
              </div>
            </div>

            {/* CLS */}
            <div className="flex items-center justify-between p-2 bg-muted rounded">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <span className="text-sm">CLS</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-mono">
                  {formatMetric(report.metrics.cls, '')}
                </span>
                {getMetricIcon(
                  getMetricStatus(report.metrics.cls, report.budget.cls)
                )}
              </div>
            </div>

            {/* FCP */}
            <div className="flex items-center justify-between p-2 bg-muted rounded">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm">FCP</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-mono">
                  {formatMetric(report.metrics.fcp)}
                </span>
                {getMetricIcon(
                  getMetricStatus(report.metrics.fcp, report.budget.fcp)
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="space-y-4">
            {/* Additional Metrics */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Additional Metrics</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">Page Load</span>
                  <span className="text-sm font-mono">
                    {formatMetric(report.metrics.pageLoadTime)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">API Response</span>
                  <span className="text-sm font-mono">
                    {formatMetric(report.metrics.apiResponseTime)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">Bundle Size</span>
                  <span className="text-sm font-mono">
                    {formatMetric(report.metrics.bundleSize, 'KB')}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">Image Load</span>
                  <span className="text-sm font-mono">
                    {formatMetric(report.metrics.imageLoadTime)}
                  </span>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {report.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Recommendations</h4>
                <div className="space-y-2">
                  {report.recommendations.map((recommendation, index) => (
                    <Alert key={index} variant="default">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        {recommendation}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {/* Device Info */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Device Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">Device Type</span>
                  <span className="text-sm capitalize">
                    {report.metrics.deviceType || 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">Connection</span>
                  <span className="text-sm">
                    {report.metrics.connectionType || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
