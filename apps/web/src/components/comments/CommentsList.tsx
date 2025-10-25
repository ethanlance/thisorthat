'use client';

import { useState, useEffect, useCallback } from 'react';
import { CommentService, CommentWithUser } from '@/lib/services/comments';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface CommentsListProps {
  pollId: string;
}

export default function CommentsList({ pollId }: CommentsListProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const limit = 20;

  const loadComments = useCallback(
    async (reset = false) => {
      setLoading(true);
      setError(null);

      try {
        const newComments = await CommentService.getPollComments(
          pollId,
          limit,
          reset ? 0 : offset
        );

        if (reset) {
          setComments(newComments);
          setOffset(newComments.length);
        } else {
          setComments(prev => [...prev, ...newComments]);
          setOffset(prev => prev + newComments.length);
        }

        setHasMore(newComments.length === limit);
      } catch (err) {
        console.error('Error loading comments:', {
          error: err,
          pollId,
          limit,
          offset,
        });
        setError('Failed to load comments. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [pollId, limit, offset]
  );

  useEffect(() => {
    loadComments(true);
  }, [pollId, loadComments]);

  const handleCommentAdded = () => {
    loadComments(true);
  };

  const handleCommentUpdated = () => {
    loadComments(true);
  };

  const handleCommentDeleted = () => {
    loadComments(true);
  };

  const handleLoadMore = () => {
    loadComments(false);
  };

  if (loading && comments.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2 text-muted-foreground">Loading comments...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8 text-destructive">
        <AlertCircle className="h-6 w-6 mr-2" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Comment Form */}
      <CommentForm
        pollId={pollId}
        onCommentAdded={handleCommentAdded}
        placeholder={user ? 'Share your thoughts...' : 'Sign in to comment...'}
      />

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No comments yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onCommentUpdated={handleCommentUpdated}
              onCommentDeleted={handleCommentDeleted}
            />
          ))}

          {hasMore && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Load more comments
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
