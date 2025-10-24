import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CommentWithUser } from '@/lib/services/comments';

export function useRealtimeComments(pollId: string) {
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to comment changes
    const channel = supabase
      .channel(`comments:${pollId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `poll_id=eq.${pollId}`,
        },
        payload => {
          console.log('Comment change received:', payload);

          if (payload.eventType === 'INSERT') {
            // New comment added - we'll need to fetch it with full details
            // For now, just trigger a refresh
            setComments(prev => [...prev]);
          } else if (payload.eventType === 'UPDATE') {
            // Comment updated
            setComments(prev =>
              prev.map(comment =>
                comment.id === payload.new.id
                  ? { ...comment, ...payload.new }
                  : comment
              )
            );
          } else if (payload.eventType === 'DELETE') {
            // Comment deleted
            setComments(prev =>
              prev.filter(comment => comment.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pollId, supabase]);

  return {
    comments,
    setComments,
    loading,
    setLoading,
  };
}
