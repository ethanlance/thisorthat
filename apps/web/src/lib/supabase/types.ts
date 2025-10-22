import { Database } from '@/types/database';

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];

export type Poll = Tables<'polls'>;
export type Vote = Tables<'votes'>;
export type Comment = Tables<'comments'>;
export type PollShare = Tables<'poll_shares'>;

export type PollInsert = Database['public']['Tables']['polls']['Insert'];
export type VoteInsert = Database['public']['Tables']['votes']['Insert'];
export type CommentInsert = Database['public']['Tables']['comments']['Insert'];
export type PollShareInsert =
  Database['public']['Tables']['poll_shares']['Insert'];

export type PollUpdate = Database['public']['Tables']['polls']['Update'];
export type VoteUpdate = Database['public']['Tables']['votes']['Update'];
export type CommentUpdate = Database['public']['Tables']['comments']['Update'];
export type PollShareUpdate =
  Database['public']['Tables']['poll_shares']['Update'];
