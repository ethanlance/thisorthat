'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { CommentService, CommentWithUser } from '@/lib/services/comments';
import {
  ThumbsUp,
  ThumbsDown,
  Reply,
  MoreHorizontal,
  Edit,
  Trash2,
  Flag,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import CommentForm from './CommentForm';
import CommentReplies from './CommentReplies';
import ReportContent from '@/components/moderation/ReportContent';

interface CommentItemProps {
  comment: CommentWithUser;
  onCommentUpdated: () => void;
  onCommentDeleted: () => void;
}

export default function CommentItem({
  comment,
  onCommentUpdated,
  onCommentDeleted,
}: CommentItemProps) {
  const [showReportForm, setShowReportForm] = useState(false);
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const isOwnComment = user?.id === comment.user_id;
  const canEdit = isOwnComment && !comment.is_deleted;
  const canDelete = isOwnComment && !comment.is_deleted;

  const handleReaction = async (reactionType: 'like' | 'dislike' | 'none') => {
    if (!user) {
      toast.error('Please sign in to react');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await CommentService.updateCommentReaction(
        comment.id,
        reactionType
      );

      if (success) {
        onCommentUpdated();
      } else {
        toast.error('Failed to update reaction');
      }
    } catch (error) {
      console.error('Error updating reaction:', error);
      toast.error('Failed to update reaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (newContent: string) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const success = await CommentService.updateComment(
        comment.id,
        newContent,
        user.id
      );

      if (success) {
        setIsEditing(false);
        onCommentUpdated();
        toast.success('Comment updated');
      } else {
        toast.error('Failed to update comment');
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Failed to update comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;

    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await CommentService.deleteComment(comment.id, user.id);

      if (success) {
        onCommentDeleted();
        toast.success('Comment deleted');
      } else {
        toast.error('Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReport = () => {
    setShowReportForm(true);
    setShowActions(false);
  };

  const getReactionButton = (type: 'like' | 'dislike') => {
    const isActive = comment.user_reaction === type;
    const count = type === 'like' ? comment.like_count : comment.dislike_count;
    const Icon = type === 'like' ? ThumbsUp : ThumbsDown;

    return (
      <Button
        variant={isActive ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleReaction(isActive ? 'none' : type)}
        disabled={isSubmitting}
        className="flex items-center space-x-1"
      >
        <Icon className="h-4 w-4" />
        <span>{count}</span>
      </Button>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex space-x-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.user_avatar_url || undefined} />
          <AvatarFallback>{comment.user_display_name.charAt(0)}</AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-sm">
              {comment.user_display_name}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at))} ago
            </span>
            {comment.is_edited && (
              <Badge variant="secondary" className="text-xs">
                <Edit className="h-3 w-3 mr-1" />
                edited
              </Badge>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                className="w-full p-2 border rounded-md resize-none"
                rows={3}
                maxLength={500}
                disabled={isSubmitting}
              />
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {editContent.length}/500 characters
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(comment.content);
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleEdit(editContent)}
                    disabled={
                      isSubmitting ||
                      !editContent.trim() ||
                      editContent.length > 500
                    }
                  >
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-foreground whitespace-pre-wrap">
              {comment.content}
            </div>
          )}

          {!isEditing && (
            <div className="flex items-center space-x-4">
              {getReactionButton('like')}
              {getReactionButton('dislike')}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsReplying(!isReplying)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Reply className="h-4 w-4 mr-1" />
                Reply
              </Button>

              {comment.reply_count > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplies(!showReplies)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {showReplies ? 'Hide' : 'Show'} {comment.reply_count}{' '}
                  {comment.reply_count === 1 ? 'reply' : 'replies'}
                </Button>
              )}

              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowActions(!showActions)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>

                {showActions && (
                  <div className="absolute right-0 top-8 bg-background border rounded-md shadow-lg z-10 min-w-[120px]">
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="w-full justify-start"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDelete}
                        className="w-full justify-start text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    )}
                    {!isOwnComment && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleReport}
                        className="w-full justify-start text-destructive"
                      >
                        <Flag className="h-4 w-4 mr-2" />
                        Report
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {isReplying && (
        <div className="ml-11">
          <CommentForm
            pollId={comment.poll_id}
            parentId={comment.id}
            onCommentAdded={() => {
              setIsReplying(false);
              onCommentUpdated();
            }}
            placeholder="Write a reply..."
            isReply={true}
          />
        </div>
      )}

      {showReplies && (
        <div className="ml-11">
          <CommentReplies parentId={comment.id} />
        </div>
      )}

      {showReportForm && (
        <div className="ml-11 mt-4">
          <ReportContent
            contentType="comment"
            contentId={comment.id}
            onReportSubmitted={() => {
              setShowReportForm(false);
              toast.success('Comment reported successfully');
            }}
          />
        </div>
      )}
    </div>
  );
}
