'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Share2, Trash2, Eye, Check } from 'lucide-react';
import { UserPollSummary } from '@/lib/services/dashboard';
import { DashboardService } from '@/lib/services/dashboard';
import { cn } from '@/lib/utils';

interface PollActionsProps {
  poll: UserPollSummary;
  onDelete?: (pollId: string) => void;
  onShare?: (pollId: string) => void;
  onView?: (pollId: string) => void;
  className?: string;
}

export default function PollActions({
  poll,
  onDelete,
  onShare,
  onView,
  className,
}: PollActionsProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const handleShare = async () => {
    try {
      setIsSharing(true);
      setShareSuccess(false);

      const shareUrl = DashboardService.getPollShareUrl(poll.id);

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      }

      onShare?.(poll.id);
      setShowMenu(false);
    } catch (error) {
      console.error('Failed to share poll:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await DashboardService.deletePoll(poll.id);
      onDelete?.(poll.id);
      setShowDeleteDialog(false);
      setShowMenu(false);
    } catch (error) {
      console.error('Failed to delete poll:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleView = () => {
    if (onView) {
      onView(poll.id);
    } else {
      window.open(`/poll/${poll.id}`, '_blank');
    }
    setShowMenu(false);
  };

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowMenu(!showMenu)}
        className="h-8 w-8 p-0"
        aria-label="Poll actions"
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 top-9 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-20 min-w-[160px]">
            <div className="py-1">
              <button
                onClick={handleView}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                View Poll
              </button>

              <button
                onClick={handleShare}
                disabled={isSharing}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50"
              >
                {shareSuccess ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
                {shareSuccess ? 'Copied!' : 'Share Poll'}
              </button>

              <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

              <button
                onClick={() => setShowDeleteDialog(true)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600 dark:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
                Delete Poll
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-30 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">Delete Poll</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Are you sure you want to delete this poll? This action cannot be
              undone and will remove all votes and comments.
            </p>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
