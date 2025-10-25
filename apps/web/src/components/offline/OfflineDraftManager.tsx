'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Save,
  Edit,
  Trash2,
  Upload,
  Clock,
  Database,
  AlertCircle,
  CheckCircle,
  Plus,
  Image as ImageIcon,
} from 'lucide-react';
import { OfflineStorage, OfflineDraft } from '@/lib/offline/OfflineStorage';
import { OfflineSync } from '@/lib/offline/OfflineSync';
import { cn } from '@/lib/utils';

interface OfflineDraftManagerProps {
  className?: string;
}

export function OfflineDraftManager({ className }: OfflineDraftManagerProps) {
  const [drafts, setDrafts] = useState<OfflineDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDraft, setEditingDraft] = useState<OfflineDraft | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [syncStatus, setSyncStatus] = useState({
    pendingDrafts: 0,
    syncInProgress: false,
  });

  const offlineStorage = OfflineStorage.getInstance();
  const offlineSync = OfflineSync.getInstance();

  useEffect(() => {
    loadDrafts();
    updateSyncStatus();
  }, []);

  const loadDrafts = async () => {
    try {
      setLoading(true);
      const draftList = await offlineStorage.getDrafts();
      setDrafts(draftList);
    } catch (error) {
      console.error('Error loading drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSyncStatus = async () => {
    const status = await offlineSync.getSyncStatus();
    setSyncStatus({
      pendingDrafts: status.pendingDrafts,
      syncInProgress: status.syncInProgress,
    });
  };

  const handleCreateDraft = () => {
    const newDraft: OfflineDraft = {
      id: `draft_${Date.now()}_${Math.random()}`,
      title: '',
      description: '',
      option_a: '',
      option_b: '',
      is_public: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      synced: false,
    };
    setEditingDraft(newDraft);
    setIsCreating(true);
  };

  const handleEditDraft = (draft: OfflineDraft) => {
    setEditingDraft(draft);
    setIsCreating(false);
  };

  const handleSaveDraft = async () => {
    if (!editingDraft) return;

    try {
      editingDraft.updated_at = new Date().toISOString();
      await offlineStorage.saveDraft(editingDraft);
      await loadDrafts();
      setEditingDraft(null);
      setIsCreating(false);
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    if (confirm('Are you sure you want to delete this draft?')) {
      try {
        await offlineStorage.deleteDraft(draftId);
        await loadDrafts();
      } catch (error) {
        console.error('Error deleting draft:', error);
      }
    }
  };

  const handleSyncDrafts = async () => {
    try {
      await offlineSync.forceSync();
      await loadDrafts();
      await updateSyncStatus();
    } catch (error) {
      console.error('Error syncing drafts:', error);
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
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

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Offline Drafts
              </CardTitle>
              <CardDescription>
                Create and manage polls offline
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {syncStatus.pendingDrafts > 0 && (
                <Badge variant="outline">
                  {syncStatus.pendingDrafts} pending
                </Badge>
              )}
              <Button onClick={handleCreateDraft} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Draft
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Draft Editor */}
      {editingDraft && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              {isCreating ? 'Create New Draft' : 'Edit Draft'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Poll Title</Label>
                <Input
                  id="title"
                  value={editingDraft.title}
                  onChange={(e) => setEditingDraft({ ...editingDraft, title: e.target.value })}
                  placeholder="What's your poll about?"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={editingDraft.description || ''}
                  onChange={(e) => setEditingDraft({ ...editingDraft, description: e.target.value })}
                  placeholder="Add more context..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="option_a">Option A</Label>
                <Input
                  id="option_a"
                  value={editingDraft.option_a}
                  onChange={(e) => setEditingDraft({ ...editingDraft, option_a: e.target.value })}
                  placeholder="First option"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="option_b">Option B</Label>
                <Input
                  id="option_b"
                  value={editingDraft.option_b}
                  onChange={(e) => setEditingDraft({ ...editingDraft, option_b: e.target.value })}
                  placeholder="Second option"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_public"
                checked={editingDraft.is_public}
                onCheckedChange={(checked) => setEditingDraft({ ...editingDraft, is_public: checked })}
              />
              <Label htmlFor="is_public">Make this poll public</Label>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={handleSaveDraft} disabled={!editingDraft.title || !editingDraft.option_a || !editingDraft.option_b}>
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button variant="outline" onClick={() => setEditingDraft(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Drafts List */}
      {drafts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No drafts yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first poll draft to get started
              </p>
              <Button onClick={handleCreateDraft}>
                <Plus className="h-4 w-4 mr-2" />
                Create Draft
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {drafts.map((draft) => (
            <Card key={draft.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{draft.title || 'Untitled Poll'}</CardTitle>
                    {draft.description && (
                      <CardDescription>{draft.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {draft.synced ? (
                      <Badge variant="default" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Synced
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="font-medium text-sm">Option A</div>
                      <div className="text-sm text-muted-foreground">{draft.option_a}</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="font-medium text-sm">Option B</div>
                      <div className="text-sm text-muted-foreground">{draft.option_b}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span>Public: {draft.is_public ? 'Yes' : 'No'}</span>
                      <span>Updated: {formatTimeAgo(draft.updated_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditDraft(draft)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteDraft(draft.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Sync Status */}
      {syncStatus.pendingDrafts > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {syncStatus.pendingDrafts} drafts waiting to sync. 
            {!syncStatus.syncInProgress && (
              <Button
                variant="link"
                className="p-0 h-auto ml-2"
                onClick={handleSyncDrafts}
              >
                Sync now
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
