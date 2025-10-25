'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  ErrorHandlingService,
  ErrorReport,
  UserFeedback,
} from '@/lib/services/error-handling';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertTriangle,
  Bug,
  MessageSquare,
  RefreshCw,
  Search,
  Filter,
  Download,
  Eye,
  Clock,
  User,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Using the types from ErrorHandlingService

const severityConfig = {
  low: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  medium: {
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
  },
  high: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  critical: {
    color: 'text-red-700',
    bg: 'bg-red-100',
    border: 'border-red-300',
  },
};

const statusConfig = {
  open: { color: 'text-orange-600', bg: 'bg-orange-50' },
  under_review: { color: 'text-blue-600', bg: 'bg-blue-50' },
  in_progress: { color: 'text-purple-600', bg: 'bg-purple-50' },
  resolved: { color: 'text-green-600', bg: 'bg-green-50' },
  closed: { color: 'text-gray-600', bg: 'bg-gray-50' },
};

const priorityConfig = {
  low: { color: 'text-gray-600', bg: 'bg-gray-50' },
  medium: { color: 'text-yellow-600', bg: 'bg-yellow-50' },
  high: { color: 'text-orange-600', bg: 'bg-orange-50' },
  urgent: { color: 'text-red-600', bg: 'bg-red-50' },
};

export function ErrorMonitoringDashboard() {
  const { user } = useAuth();
  const [errorLogs, setErrorLogs] = useState<ErrorReport[]>([]);
  const [userFeedback, setUserFeedback] = useState<UserFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [errorSeverityFilter, setErrorSeverityFilter] = useState<string>('all');
  const [feedbackStatusFilter, setFeedbackStatusFilter] =
    useState<string>('all');
  const [feedbackTypeFilter, setFeedbackTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Check if user has admin permissions
  const isAdmin =
    user?.user_metadata?.role === 'admin' ||
    user?.user_metadata?.role === 'moderator';

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = async () => {
    try {
      setLoading(true);
      const errorStats = await ErrorHandlingService.getErrorStats('day');
      const feedback = await ErrorHandlingService.getUserFeedback(
        user?.id || ''
      );

      setErrorLogs(errorStats.recent_errors);
      setUserFeedback(feedback);
    } catch (err) {
      setError('Failed to load monitoring data');
      console.error('Error loading monitoring data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredErrorLogs = errorLogs.filter(log => {
    if (errorSeverityFilter !== 'all' && log.severity !== errorSeverityFilter)
      return false;
    if (
      searchQuery &&
      !log.error_message.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const filteredFeedback = userFeedback.filter(feedback => {
    if (
      feedbackStatusFilter !== 'all' &&
      feedback.status !== feedbackStatusFilter
    )
      return false;
    if (
      feedbackTypeFilter !== 'all' &&
      feedback.feedback_type !== feedbackTypeFilter
    )
      return false;
    if (
      searchQuery &&
      !feedback.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !feedback.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleString();
  };

  const exportData = (type: 'errors' | 'feedback') => {
    const data = type === 'errors' ? filteredErrorLogs : filteredFeedback;
    const csv = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(item =>
        Object.values(item)
          .map(val =>
            typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
          )
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!isAdmin) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          You don&apos;t have permission to access the error monitoring
          dashboard.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading monitoring data...
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Error Monitoring Dashboard</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => exportData('errors')}
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Errors
          </Button>
          <Button
            onClick={() => exportData('feedback')}
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Feedback
          </Button>
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Errors</p>
                <p className="text-2xl font-bold">{errorLogs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Critical Errors</p>
                <p className="text-2xl font-bold">
                  {errorLogs.filter(e => e.severity === 'critical').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Open Feedback</p>
                <p className="text-2xl font-bold">
                  {userFeedback.filter(f => f.status === 'open').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Bug Reports</p>
                <p className="text-2xl font-bold">
                  {
                    userFeedback.filter(f => f.feedback_type === 'bug_report')
                      .length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Error Severity
              </label>
              <Select
                value={errorSeverityFilter}
                onValueChange={setErrorSeverityFilter}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Feedback Status
              </label>
              <Select
                value={feedbackStatusFilter}
                onValueChange={setFeedbackStatusFilter}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Feedback Type
              </label>
              <Select
                value={feedbackTypeFilter}
                onValueChange={setFeedbackTypeFilter}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="bug_report">Bug Report</SelectItem>
                  <SelectItem value="feature_request">
                    Feature Request
                  </SelectItem>
                  <SelectItem value="general_feedback">
                    General Feedback
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Tables */}
      <Tabs defaultValue="errors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="errors">
            Error Logs ({filteredErrorLogs.length})
          </TabsTrigger>
          <TabsTrigger value="feedback">
            User Feedback ({filteredFeedback.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Error Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredErrorLogs.map(log => (
                  <div
                    key={log.id}
                    className={cn(
                      'p-4 rounded-lg border',
                      severityConfig[log.severity].bg,
                      severityConfig[log.severity].border
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant="outline"
                            className={severityConfig[log.severity].color}
                          >
                            {log.severity}
                          </Badge>
                          <Badge variant="secondary">{log.error_code}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(log.created_at)}
                          </span>
                        </div>
                        <p className="font-medium mb-1">{log.error_message}</p>
                        {log.error_stack && (
                          <p className="text-sm text-muted-foreground">
                            Stack: {log.error_stack}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {filteredErrorLogs.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No error logs found matching your filters.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredFeedback.map(feedback => (
                  <div key={feedback.id} className="p-4 rounded-lg border">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant="outline"
                            className={statusConfig[feedback.status].color}
                          >
                            {feedback.status}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className={priorityConfig[feedback.priority].color}
                          >
                            {feedback.priority}
                          </Badge>
                          <Badge variant="outline">
                            {feedback.feedback_type.replace('_', ' ')}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(feedback.created_at)}
                          </span>
                        </div>
                        <h4 className="font-medium mb-1">{feedback.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {feedback.description}
                        </p>
                        {feedback.additional_data && (
                          <div className="text-xs text-muted-foreground">
                            <details>
                              <summary className="cursor-pointer">
                                Additional Data
                              </summary>
                              <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                                {JSON.stringify(
                                  feedback.additional_data,
                                  null,
                                  2
                                )}
                              </pre>
                            </details>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {filteredFeedback.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No feedback found matching your filters.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
