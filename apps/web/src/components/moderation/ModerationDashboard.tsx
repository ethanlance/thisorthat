'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  BarChart3,
  Loader2,
  Eye,
  Trash2,
  Flag,
} from 'lucide-react';

interface ModerationQueueItem {
  report_id: string;
  content_type: string;
  content_id: string;
  report_category: string;
  description: string | null;
  reporter_email: string | null;
  created_at: string;
  status: string;
}

interface ModerationStats {
  total_reports: number;
  pending_reports: number;
  resolved_reports: number;
  total_actions: number;
  appeals_pending: number;
}

export default function ModerationDashboard() {
  const [queue, setQueue] = useState<ModerationQueueItem[]>([]);
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ModerationQueueItem | null>(
    null
  );
  const [actionType, setActionType] = useState<string>('');
  const [actionReason, setActionReason] = useState('');
  const [actionSeverity, setActionSeverity] = useState<string>('medium');
  const [isTakingAction, setIsTakingAction] = useState(false);

  useEffect(() => {
    loadModerationData();
  }, []);

  const loadModerationData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load moderation queue
      const queueResponse = await fetch('/api/moderation/queue');
      if (!queueResponse.ok) {
        throw new Error('Failed to load moderation queue');
      }
      const queueData = await queueResponse.json();
      setQueue(queueData.queue || []);

      // Load moderation stats
      const statsResponse = await fetch('/api/moderation/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error('Error loading moderation data:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load moderation data'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTakeAction = async () => {
    if (!selectedItem || !actionType) {
      return;
    }

    setIsTakingAction(true);
    try {
      const response = await fetch('/api/moderation/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content_type: selectedItem.content_type,
          content_id: selectedItem.content_id,
          action_type: actionType,
          reason: actionReason.trim() || undefined,
          severity: actionSeverity,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to take action');
      }

      // Refresh the queue
      await loadModerationData();
      setSelectedItem(null);
      setActionType('');
      setActionReason('');
      setActionSeverity('medium');
    } catch (err) {
      console.error('Error taking action:', err);
      setError(err instanceof Error ? err.message : 'Failed to take action');
    } finally {
      setIsTakingAction(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'inappropriate_content':
        return 'bg-red-100 text-red-800';
      case 'spam':
        return 'bg-yellow-100 text-yellow-800';
      case 'harassment':
        return 'bg-orange-100 text-orange-800';
      case 'violence':
        return 'bg-red-100 text-red-800';
      case 'hate_speech':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'approve':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'reject':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'delete':
        return <Trash2 className="h-4 w-4 text-red-500" />;
      case 'hide':
        return <Eye className="h-4 w-4 text-yellow-500" />;
      case 'escalate':
        return <Flag className="h-4 w-4 text-orange-500" />;
      case 'warn_user':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading moderation dashboard...</span>
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
          <h1 className="text-2xl font-bold flex items-center space-x-2">
            <Shield className="h-6 w-6" />
            <span>Moderation Dashboard</span>
          </h1>
          <p className="text-muted-foreground">
            Review and moderate reported content
          </p>
        </div>
        <Button onClick={loadModerationData} variant="outline">
          <BarChart3 className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Flag className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Total Reports</p>
                  <p className="text-2xl font-bold">{stats.total_reports}</p>
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
                  <p className="text-2xl font-bold">{stats.pending_reports}</p>
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
                  <p className="text-2xl font-bold">{stats.resolved_reports}</p>
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
                  <p className="text-2xl font-bold">{stats.total_actions}</p>
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
                  <p className="text-2xl font-bold">{stats.appeals_pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Moderation Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Queue List */}
        <Card>
          <CardHeader>
            <CardTitle>Moderation Queue</CardTitle>
          </CardHeader>
          <CardContent>
            {queue.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No pending reports</p>
              </div>
            ) : (
              <div className="space-y-3">
                {queue.map(item => (
                  <div
                    key={item.report_id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedItem?.report_id === item.report_id
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="capitalize">
                            {item.content_type}
                          </Badge>
                          <Badge
                            className={getCategoryColor(item.report_category)}
                          >
                            {item.report_category.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Reported by {item.reporter_email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {item.description && (
                      <p className="text-sm mt-2 text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Take Action</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedItem ? (
              <div className="text-center py-8 text-muted-foreground">
                <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a report to take action</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Selected Item Info */}
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant="outline" className="capitalize">
                      {selectedItem.content_type}
                    </Badge>
                    <Badge
                      className={getCategoryColor(selectedItem.report_category)}
                    >
                      {selectedItem.report_category.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Reported by {selectedItem.reporter_email}
                  </p>
                  {selectedItem.description && (
                    <p className="text-sm mt-2">{selectedItem.description}</p>
                  )}
                </div>

                {/* Action Form */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="action-type">Action</Label>
                    <Select value={actionType} onValueChange={setActionType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approve">
                          <div className="flex items-center space-x-2">
                            {getActionIcon('approve')}
                            <span>Approve</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="reject">
                          <div className="flex items-center space-x-2">
                            {getActionIcon('reject')}
                            <span>Reject</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="delete">
                          <div className="flex items-center space-x-2">
                            {getActionIcon('delete')}
                            <span>Delete</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="hide">
                          <div className="flex items-center space-x-2">
                            {getActionIcon('hide')}
                            <span>Hide</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="escalate">
                          <div className="flex items-center space-x-2">
                            {getActionIcon('escalate')}
                            <span>Escalate</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="warn_user">
                          <div className="flex items-center space-x-2">
                            {getActionIcon('warn_user')}
                            <span>Warn User</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="severity">Severity</Label>
                    <Select
                      value={actionSeverity}
                      onValueChange={setActionSeverity}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason (Optional)</Label>
                    <Textarea
                      id="reason"
                      placeholder="Explain the reason for this action..."
                      value={actionReason}
                      onChange={e => setActionReason(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={handleTakeAction}
                    disabled={!actionType || isTakingAction}
                    className="w-full"
                  >
                    {isTakingAction ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Taking Action...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Take Action
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
