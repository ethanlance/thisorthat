'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CommentService,
  CommentReply,
  CommentWithUser,
} from '@/lib/services/comments';
import CommentItem from './CommentItem';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface CommentRepliesProps {
  parentId: string;
}

export default function CommentReplies({ parentId }: CommentRepliesProps) {
  const [replies, setReplies] = useState<CommentReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 10;

  const loadReplies = useCallback(
    async (reset = false) => {
      setLoading(true);
      try {
        const newReplies = await CommentService.getCommentReplies(
          parentId,
          limit,
          reset ? 0 : offset
        );

        if (reset) {
          setReplies(newReplies);
          setOffset(newReplies.length);
        } else {
          setReplies(prev => [...prev, ...newReplies]);
          setOffset(prev => prev + newReplies.length);
        }

        setHasMore(newReplies.length === limit);
      } catch (error) {
        console.error('Error loading replies:', error);
      } finally {
        setLoading(false);
      }
    },
    [parentId, limit, offset]
  );

  useEffect(() => {
    loadReplies(true);
  }, [parentId, loadReplies]);

  const handleLoadMore = () => {
    loadReplies(false);
  };

  if (loading && replies.length === 0) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="ml-2 text-sm text-muted-foreground">
          Loading replies...
        </span>
      </div>
    );
  }

  if (replies.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {replies.map(reply => (
        <CommentItem
          key={reply.id}
          comment={reply as CommentWithUser}
          onCommentUpdated={() => loadReplies(true)}
          onCommentDeleted={() => loadReplies(true)}
        />
      ))}

      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadMore}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Load more replies'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
