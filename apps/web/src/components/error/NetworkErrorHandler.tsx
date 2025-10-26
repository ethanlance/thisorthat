'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  WifiOff,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

interface NetworkStatus {
  isOnline: boolean;
  isReconnecting: boolean;
  lastOnline: Date | null;
  connectionAttempts: number;
}

export default function NetworkErrorHandler() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isReconnecting: false,
    lastOnline: navigator.onLine ? new Date() : null,
    connectionAttempts: 0,
  });

  const [showOfflineBanner, setShowOfflineBanner] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: true,
        isReconnecting: false,
        lastOnline: new Date(),
        connectionAttempts: 0,
      }));
      setShowOfflineBanner(false);
    };

    const handleOffline = () => {
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: false,
        isReconnecting: false,
      }));
      setShowOfflineBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleReconnect = async () => {
    setNetworkStatus(prev => ({
      ...prev,
      isReconnecting: true,
      connectionAttempts: prev.connectionAttempts + 1,
    }));

    try {
      // Test connection by making a simple request
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
      });

      if (response.ok) {
        setNetworkStatus(prev => ({
          ...prev,
          isOnline: true,
          isReconnecting: false,
          lastOnline: new Date(),
        }));
        setShowOfflineBanner(false);
      } else {
        throw new Error('Connection test failed');
      }
    } catch {
      setNetworkStatus(prev => ({
        ...prev,
        isReconnecting: false,
      }));
    }
  };

  const getConnectionStatus = () => {
    if (networkStatus.isOnline) {
      return {
        icon: <CheckCircle className="h-4 w-4 text-green-600" />,
        text: 'Connected',
        color: 'bg-green-100 text-green-800',
      };
    }

    if (networkStatus.isReconnecting) {
      return {
        icon: <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />,
        text: 'Reconnecting...',
        color: 'bg-yellow-100 text-yellow-800',
      };
    }

    return {
      icon: <WifiOff className="h-4 w-4 text-red-600" />,
      text: 'Offline',
      color: 'bg-red-100 text-red-800',
    };
  };

  const getOfflineMessage = () => {
    if (networkStatus.connectionAttempts > 0) {
      return `Connection failed. This is attempt ${networkStatus.connectionAttempts + 1}.`;
    }
    return "You're currently offline. Some features may not be available.";
  };

  const getReconnectMessage = () => {
    if (networkStatus.lastOnline) {
      const timeSinceLastOnline = Math.floor(
        (Date.now() - networkStatus.lastOnline.getTime()) / 1000 / 60
      );
      return `Last connected ${timeSinceLastOnline} minute${timeSinceLastOnline !== 1 ? 's' : ''} ago.`;
    }
    return 'Check your internet connection and try again.';
  };

  if (!showOfflineBanner && networkStatus.isOnline) {
    return null;
  }

  const connectionStatus = getConnectionStatus();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4">
      <Card className="max-w-md mx-auto shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {connectionStatus.icon}
              <CardTitle className="text-lg">Network Status</CardTitle>
            </div>
            <Badge className={connectionStatus.color}>
              {connectionStatus.text}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant={networkStatus.isOnline ? 'default' : 'destructive'}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {networkStatus.isOnline
                ? "Connection restored! You're back online."
                : getOfflineMessage()}
            </AlertDescription>
          </Alert>

          {!networkStatus.isOnline && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {getReconnectMessage()}
              </p>

              <div className="flex space-x-2">
                <Button
                  onClick={handleReconnect}
                  disabled={networkStatus.isReconnecting}
                  size="sm"
                  className="flex-1"
                >
                  {networkStatus.isReconnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  {networkStatus.isReconnecting
                    ? 'Reconnecting...'
                    : 'Try Again'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOfflineBanner(false)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          {networkStatus.isOnline && (
            <div className="flex items-center space-x-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Connection restored successfully!</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
