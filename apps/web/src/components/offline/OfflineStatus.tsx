'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Wifi,
  WifiOff,
  Sync,
  CheckCircle,
  AlertCircle,
  Clock,
  Database,
  Trash2,
  Download,
  Upload,
} from 'lucide-react';
import { OfflineSync } from '@/lib/offline/OfflineSync';
import { OfflineStorage } from '@/lib/offline/OfflineStorage';
import { cn } from '@/lib/utils';

interface OfflineStatusProps {
  className?: string;
  showDetails?: boolean;
}

export function OfflineStatus({ className, showDetails = false }: OfflineStatusProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState({
    isOnline: navigator.onLine,
    lastSync: null as Date | null,
    pendingVotes: 0,
    pendingDrafts: 0,
    syncInProgress: false,
  });
  const [storageUsage, setStorageUsage] = useState({ used: 0, quota: 0, percentage: 0 });
  const [showStorageDetails, setShowStorageDetails] = useState(false);

  const offlineSync = OfflineSync.getInstance();
  const offlineStorage = OfflineStorage.getInstance();

  useEffect(() => {
    const updateStatus = async () => {
      const status = await offlineSync.getSyncStatus();
      setSyncStatus(status);
    };

    const updateStorage = async () => {
      const usage = await offlineStorage.getStorageUsage();
      setStorageUsage(usage);
    };

    updateStatus();
    updateStorage();

    const interval = setInterval(() => {
      updateStatus();
      updateStorage();
    }, 5000);

    const handleOnline = () => {
      setIsOnline(true);
      updateStatus();
    };

    const handleOffline = () => {
      setIsOnline(false);
      updateStatus();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSync = async () => {
    try {
      const result = await offlineSync.forceSync();
      if (result.success) {
        // Update status after sync
        const status = await offlineSync.getSyncStatus();
        setSyncStatus(status);
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  const handleClearData = async () => {
    if (confirm('Are you sure you want to clear all offline data? This cannot be undone.')) {
      await offlineStorage.clearAllData();
      const status = await offlineSync.getSyncStatus();
      setSyncStatus(status);
    }
  };

  const handleCleanup = async () => {
    await offlineStorage.cleanupOldData();
    const usage = await offlineStorage.getStorageUsage();
    setStorageUsage(usage);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimeAgo = (date: Date | null): string => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Connection Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            {isOnline ? 'Online' : 'Offline'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {isOnline ? 'Connected to internet' : 'No internet connection'}
              </p>
              {!isOnline && (
                <p className="text-xs text-muted-foreground">
                  Some features may be limited
                </p>
              )}
            </div>
            <Badge variant={isOnline ? 'default' : 'secondary'}>
              {isOnline ? 'Connected' : 'Offline'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Sync Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sync className={cn(
              'h-5 w-5',
              syncStatus.syncInProgress ? 'animate-spin text-blue-500' : 'text-muted-foreground'
            )} />
            Sync Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Last Sync</p>
              <p className="text-xs text-muted-foreground">
                {formatTimeAgo(syncStatus.lastSync)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {syncStatus.pendingVotes > 0 && (
                <Badge variant="outline" className="text-xs">
                  {syncStatus.pendingVotes} votes
                </Badge>
              )}
              {syncStatus.pendingDrafts > 0 && (
                <Badge variant="outline" className="text-xs">
                  {syncStatus.pendingDrafts} drafts
                </Badge>
              )}
            </div>
          </div>

          {syncStatus.pendingVotes > 0 || syncStatus.pendingDrafts > 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {syncStatus.pendingVotes + syncStatus.pendingDrafts} items waiting to sync
              </AlertDescription>
            </Alert>
          ) : (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">All data synced</span>
            </div>
          )}

          {isOnline && (syncStatus.pendingVotes > 0 || syncStatus.pendingDrafts > 0) && (
            <Button
              onClick={handleSync}
              disabled={syncStatus.syncInProgress}
              className="w-full"
              size="sm"
            >
              {syncStatus.syncInProgress ? (
                <>
                  <Sync className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Sync Now
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Storage Details */}
      {showDetails && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="h-5 w-5" />
              Offline Storage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Storage Used</span>
                <span>{formatBytes(storageUsage.used)} / {formatBytes(storageUsage.quota)}</span>
              </div>
              <Progress value={storageUsage.percentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {storageUsage.percentage.toFixed(1)}% of available storage
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCleanup}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Cleanup
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearData}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
