'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { CommentService } from '@/lib/services/comments';
import { Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CommentFormProps {
  pollId: string;
  parentId?: string;
  onCommentAdded: () => void;
  placeholder?: string;
  isReply?: boolean;
}

export default function CommentForm({
  pollId,
  parentId,
  onCommentAdded,
  placeholder = 'Write a comment...',
  isReply = false,
}: CommentFormProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [charCount, setCharCount] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please sign in to comment');
      return;
    }

    // Validate content
    const validation = CommentService.validateComment(content);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await CommentService.createComment(
        pollId,
        { content, parent_id: parentId },
        user.id
      );

      if (success) {
        setContent('');
        setCharCount(0);
        onCommentAdded();
        toast.success(isReply ? 'Reply posted!' : 'Comment posted!');
      } else {
        toast.error('Failed to post comment');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);
    setCharCount(value.length);
  };

  if (!user) {
    return (
      <div className="p-4 text-center text-muted-foreground border rounded-lg">
        <p>Please sign in to comment</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex space-x-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.user_metadata?.avatar_url} />
          <AvatarFallback>
            {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          <Textarea
            value={content}
            onChange={handleContentChange}
            placeholder={placeholder}
            className="min-h-[80px] resize-none"
            maxLength={500}
            disabled={isSubmitting}
          />

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {charCount}/500 characters
            </div>

            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setContent('');
                  setCharCount(0);
                }}
                disabled={isSubmitting || !content.trim()}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !content.trim() || charCount > 500}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {isReply ? 'Reply' : 'Comment'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
