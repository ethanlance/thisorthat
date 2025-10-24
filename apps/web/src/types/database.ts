export interface Database {
  public: {
    Tables: {
      polls: {
        Row: {
          id: string;
          creator_id: string;
          option_a_image_url: string;
          option_a_label: string | null;
          option_b_image_url: string;
          option_b_label: string | null;
          description: string | null;
          expires_at: string;
          is_public: boolean;
          status: 'active' | 'closed' | 'deleted';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          option_a_image_url: string;
          option_a_label?: string | null;
          option_b_image_url: string;
          option_b_label?: string | null;
          description?: string | null;
          expires_at?: string;
          is_public?: boolean;
          status?: 'active' | 'closed' | 'deleted';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          option_a_image_url?: string;
          option_a_label?: string | null;
          option_b_image_url?: string;
          option_b_label?: string | null;
          description?: string | null;
          expires_at?: string;
          is_public?: boolean;
          status?: 'active' | 'closed' | 'deleted';
          created_at?: string;
          updated_at?: string;
        };
      };
      votes: {
        Row: {
          id: string;
          poll_id: string;
          user_id: string | null;
          anonymous_id: string | null;
          choice: 'option_a' | 'option_b';
          created_at: string;
        };
        Insert: {
          id?: string;
          poll_id: string;
          user_id?: string | null;
          anonymous_id?: string | null;
          choice: 'option_a' | 'option_b';
          created_at?: string;
        };
        Update: {
          id?: string;
          poll_id?: string;
          user_id?: string | null;
          anonymous_id?: string | null;
          choice?: 'option_a' | 'option_b';
          created_at?: string;
        };
      };
      poll_shares: {
        Row: {
          id: string;
          poll_id: string;
          user_id: string;
          shared_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          poll_id: string;
          user_id: string;
          shared_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          poll_id?: string;
          user_id?: string;
          shared_by?: string;
          created_at?: string;
        };
      };
      user_interests: {
        Row: {
          id: string;
          user_id: string;
          interest: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          interest: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          interest?: string;
          created_at?: string;
        };
      };
      user_follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_type: string;
          achievement_data: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_type: string;
          achievement_data?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          achievement_type?: string;
          achievement_data?: Record<string, unknown>;
          created_at?: string;
        };
      };
      user_activity: {
        Row: {
          id: string;
          user_id: string;
          activity_type: string;
          activity_data: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_type: string;
          activity_data?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          activity_type?: string;
          activity_data?: Record<string, unknown>;
          created_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          poll_id: string;
          user_id: string;
          parent_id: string | null;
          content: string;
          is_edited: boolean;
          edited_at: string | null;
          is_deleted: boolean;
          deleted_at: string | null;
          deleted_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          poll_id: string;
          user_id: string;
          parent_id?: string | null;
          content: string;
          is_edited?: boolean;
          edited_at?: string | null;
          is_deleted?: boolean;
          deleted_at?: string | null;
          deleted_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          poll_id?: string;
          user_id?: string;
          parent_id?: string | null;
          content?: string;
          is_edited?: boolean;
          edited_at?: string | null;
          is_deleted?: boolean;
          deleted_at?: string | null;
          deleted_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      comment_reactions: {
        Row: {
          id: string;
          comment_id: string;
          user_id: string;
          reaction_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          comment_id: string;
          user_id: string;
          reaction_type: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          comment_id?: string;
          user_id?: string;
          reaction_type?: string;
          created_at?: string;
        };
      };
      comment_reports: {
        Row: {
          id: string;
          comment_id: string;
          reporter_id: string;
          reason: string;
          description: string | null;
          status: string;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          comment_id: string;
          reporter_id: string;
          reason: string;
          description?: string | null;
          status?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          comment_id?: string;
          reporter_id?: string;
          reason?: string;
          description?: string | null;
          status?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
      };
      comment_moderation_actions: {
        Row: {
          id: string;
          comment_id: string;
          moderator_id: string;
          action_type: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          comment_id: string;
          moderator_id: string;
          action_type: string;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          comment_id?: string;
          moderator_id?: string;
          action_type?: string;
          reason?: string | null;
          created_at?: string;
        };
      };
      content_reports: {
        Row: {
          id: string;
          reporter_id: string;
          content_type: 'poll' | 'comment' | 'user' | 'image';
          content_id: string;
          report_category:
            | 'inappropriate_content'
            | 'spam'
            | 'harassment'
            | 'violence'
            | 'hate_speech'
            | 'other';
          description: string | null;
          status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
          reviewed_by: string | null;
          reviewed_at: string | null;
          resolution: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          content_type: 'poll' | 'comment' | 'user' | 'image';
          content_id: string;
          report_category:
            | 'inappropriate_content'
            | 'spam'
            | 'harassment'
            | 'violence'
            | 'hate_speech'
            | 'other';
          description?: string | null;
          status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          resolution?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          content_type?: 'poll' | 'comment' | 'user' | 'image';
          content_id?: string;
          report_category?:
            | 'inappropriate_content'
            | 'spam'
            | 'harassment'
            | 'violence'
            | 'hate_speech'
            | 'other';
          description?: string | null;
          status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          resolution?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      moderation_actions: {
        Row: {
          id: string;
          moderator_id: string;
          content_type: 'poll' | 'comment' | 'user' | 'image';
          content_id: string;
          action_type:
            | 'approve'
            | 'reject'
            | 'delete'
            | 'hide'
            | 'escalate'
            | 'warn_user';
          reason: string | null;
          severity: 'low' | 'medium' | 'high' | 'critical';
          created_at: string;
        };
        Insert: {
          id?: string;
          moderator_id: string;
          content_type: 'poll' | 'comment' | 'user' | 'image';
          content_id: string;
          action_type:
            | 'approve'
            | 'reject'
            | 'delete'
            | 'hide'
            | 'escalate'
            | 'warn_user';
          reason?: string | null;
          severity?: 'low' | 'medium' | 'high' | 'critical';
          created_at?: string;
        };
        Update: {
          id?: string;
          moderator_id?: string;
          content_type?: 'poll' | 'comment' | 'user' | 'image';
          content_id?: string;
          action_type?:
            | 'approve'
            | 'reject'
            | 'delete'
            | 'hide'
            | 'escalate'
            | 'warn_user';
          reason?: string | null;
          severity?: 'low' | 'medium' | 'high' | 'critical';
          created_at?: string;
        };
      };
      content_classifications: {
        Row: {
          id: string;
          content_type: 'poll' | 'comment' | 'image';
          content_id: string;
          classification: 'safe' | 'questionable' | 'inappropriate' | 'spam';
          confidence_score: number;
          detection_method: string;
          details: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          content_type: 'poll' | 'comment' | 'image';
          content_id: string;
          classification: 'safe' | 'questionable' | 'inappropriate' | 'spam';
          confidence_score: number;
          detection_method: string;
          details?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          content_type?: 'poll' | 'comment' | 'image';
          content_id?: string;
          classification?: 'safe' | 'questionable' | 'inappropriate' | 'spam';
          confidence_score?: number;
          detection_method?: string;
          details?: Record<string, unknown> | null;
          created_at?: string;
        };
      };
      moderation_policies: {
        Row: {
          id: string;
          policy_name: string;
          policy_type: 'content' | 'behavior' | 'spam';
          rules: Record<string, unknown>;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          policy_name: string;
          policy_type: 'content' | 'behavior' | 'spam';
          rules: Record<string, unknown>;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          policy_name?: string;
          policy_type?: 'content' | 'behavior' | 'spam';
          rules?: Record<string, unknown>;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      content_appeals: {
        Row: {
          id: string;
          appealer_id: string;
          moderation_action_id: string;
          appeal_reason: string;
          status: 'pending' | 'approved' | 'rejected';
          reviewed_by: string | null;
          reviewed_at: string | null;
          review_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          appealer_id: string;
          moderation_action_id: string;
          appeal_reason: string;
          status?: 'pending' | 'approved' | 'rejected';
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          review_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          appealer_id?: string;
          moderation_action_id?: string;
          appeal_reason?: string;
          status?: 'pending' | 'approved' | 'rejected';
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          review_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_moderation_history: {
        Row: {
          id: string;
          user_id: string;
          violation_type: string;
          violation_description: string | null;
          severity: 'low' | 'medium' | 'high' | 'critical';
          action_taken: string;
          moderator_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          violation_type: string;
          violation_description?: string | null;
          severity?: 'low' | 'medium' | 'high' | 'critical';
          action_taken: string;
          moderator_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          violation_type?: string;
          violation_description?: string | null;
          severity?: 'low' | 'medium' | 'high' | 'critical';
          action_taken?: string;
          moderator_id?: string | null;
          created_at?: string;
        };
      };
    };
    Enums: Record<string, never>;
  };
}
