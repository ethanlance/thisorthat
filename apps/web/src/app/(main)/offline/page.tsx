import { Suspense } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { OfflineStatus } from '@/components/offline/OfflineStatus';
import { OfflinePollViewer } from '@/components/offline/OfflinePollViewer';
import { OfflineDraftManager } from '@/components/offline/OfflineDraftManager';
import { Database, WifiOff, Clock, Vote, FileText } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <WifiOff className="h-8 w-8" />
          Offline Mode
        </h1>
        <p className="text-muted-foreground">
          Manage your offline content and sync when you&apos;re back online
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Offline Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Offline Status
            </CardTitle>
            <CardDescription>
              Monitor your offline data and sync status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-32" />}>
              <OfflineStatus showDetails={true} />
            </Suspense>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common offline tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-2 mb-2">
                  <Vote className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">View Polls</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Browse cached polls
                </p>
              </Card>

              <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Create Draft</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Start a new poll
                </p>
              </Card>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Offline Features</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• View previously loaded polls</li>
                <li>• Vote on cached polls</li>
                <li>• Create and edit poll drafts</li>
                <li>• Automatic sync when online</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Draft Manager */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Poll Drafts
          </CardTitle>
          <CardDescription>Create and manage polls offline</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-64" />}>
            <OfflineDraftManager />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
