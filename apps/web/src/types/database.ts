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
          privacy_level: 'public' | 'private' | 'group';
          friend_group_id: string | null;
          access_expires_at: string | null;
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
          privacy_level?: 'public' | 'private' | 'group';
          friend_group_id?: string | null;
          access_expires_at?: string | null;
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
          privacy_level?: 'public' | 'private' | 'group';
          friend_group_id?: string | null;
          access_expires_at?: string | null;
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
      friend_groups: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          is_public: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          is_public?: boolean;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          is_public?: boolean;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          role: 'admin' | 'member';
          joined_at: string;
          invited_by: string | null;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          role?: 'admin' | 'member';
          joined_at?: string;
          invited_by?: string | null;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          role?: 'admin' | 'member';
          joined_at?: string;
          invited_by?: string | null;
        };
      };
      poll_shares: {
        Row: {
          id: string;
          poll_id: string;
          user_id: string;
          shared_by: string;
          access_level: 'view' | 'view_vote' | 'admin';
          shared_at: string;
          expires_at: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          poll_id: string;
          user_id: string;
          shared_by: string;
          access_level?: 'view' | 'view_vote' | 'admin';
          shared_at?: string;
          expires_at?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          poll_id?: string;
          user_id?: string;
          shared_by?: string;
          access_level?: 'view' | 'view_vote' | 'admin';
          shared_at?: string;
          expires_at?: string | null;
          is_active?: boolean;
        };
      };
      poll_invitations: {
        Row: {
          id: string;
          poll_id: string;
          invited_user_id: string;
          invited_by: string;
          message: string | null;
          status: 'pending' | 'accepted' | 'declined' | 'expired';
          created_at: string;
          responded_at: string | null;
          expires_at: string;
        };
        Insert: {
          id?: string;
          poll_id: string;
          invited_user_id: string;
          invited_by: string;
          message?: string | null;
          status?: 'pending' | 'accepted' | 'declined' | 'expired';
          created_at?: string;
          responded_at?: string | null;
          expires_at?: string;
        };
        Update: {
          id?: string;
          poll_id?: string;
          invited_user_id?: string;
          invited_by?: string;
          message?: string | null;
          status?: 'pending' | 'accepted' | 'declined' | 'expired';
          created_at?: string;
          responded_at?: string | null;
          expires_at?: string;
        };
      };
      group_invitations: {
        Row: {
          id: string;
          group_id: string;
          invited_user_id: string;
          invited_by: string;
          message: string | null;
          status: 'pending' | 'accepted' | 'declined' | 'expired';
          created_at: string;
          responded_at: string | null;
          expires_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          invited_user_id: string;
          invited_by: string;
          message?: string | null;
          status?: 'pending' | 'accepted' | 'declined' | 'expired';
          created_at?: string;
          responded_at?: string | null;
          expires_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          invited_user_id?: string;
          invited_by?: string;
          message?: string | null;
          status?: 'pending' | 'accepted' | 'declined' | 'expired';
          created_at?: string;
          responded_at?: string | null;
          expires_at?: string;
        };
      };
    };
    poll_categories: {
      Row: {
        id: string;
        name: string;
        description: string | null;
        color: string;
        icon: string;
        is_active: boolean;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        name: string;
        description?: string | null;
        color?: string;
        icon?: string;
        is_active?: boolean;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        name?: string;
        description?: string | null;
        color?: string;
        icon?: string;
        is_active?: boolean;
        created_at?: string;
        updated_at?: string;
      };
    };
    poll_tags: {
      Row: {
        id: string;
        name: string;
        description: string | null;
        usage_count: number;
        is_active: boolean;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        name: string;
        description?: string | null;
        usage_count?: number;
        is_active?: boolean;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        name?: string;
        description?: string | null;
        usage_count?: number;
        is_active?: boolean;
        created_at?: string;
        updated_at?: string;
      };
    };
    poll_category_assignments: {
      Row: {
        id: string;
        poll_id: string;
        category_id: string;
        assigned_by: string | null;
        created_at: string;
      };
      Insert: {
        id?: string;
        poll_id: string;
        category_id: string;
        assigned_by?: string | null;
        created_at?: string;
      };
      Update: {
        id?: string;
        poll_id?: string;
        category_id?: string;
        assigned_by?: string | null;
        created_at?: string;
      };
    };
    poll_tag_assignments: {
      Row: {
        id: string;
        poll_id: string;
        tag_id: string;
        assigned_by: string | null;
        created_at: string;
      };
      Insert: {
        id?: string;
        poll_id: string;
        tag_id: string;
        assigned_by?: string | null;
        created_at?: string;
      };
      Update: {
        id?: string;
        poll_id?: string;
        tag_id?: string;
        assigned_by?: string | null;
        created_at?: string;
      };
    };
    poll_metrics: {
      Row: {
        id: string;
        poll_id: string;
        view_count: number;
        vote_count: number;
        comment_count: number;
        share_count: number;
        engagement_score: number;
        trending_score: number;
        popularity_score: number;
        last_calculated: string;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        poll_id: string;
        view_count?: number;
        vote_count?: number;
        comment_count?: number;
        share_count?: number;
        engagement_score?: number;
        trending_score?: number;
        popularity_score?: number;
        last_calculated?: string;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        poll_id?: string;
        view_count?: number;
        vote_count?: number;
        comment_count?: number;
        share_count?: number;
        engagement_score?: number;
        trending_score?: number;
        popularity_score?: number;
        last_calculated?: string;
        created_at?: string;
        updated_at?: string;
      };
    };
    user_feed_preferences: {
      Row: {
        id: string;
        user_id: string;
        feed_type: 'personalized' | 'trending' | 'recent' | 'following';
        show_categories: string[];
        hide_categories: string[];
        show_tags: string[];
        hide_tags: string[];
        min_engagement_score: number;
        max_poll_age_days: number;
        include_private_polls: boolean;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        user_id: string;
        feed_type?: 'personalized' | 'trending' | 'recent' | 'following';
        show_categories?: string[];
        hide_categories?: string[];
        show_tags?: string[];
        hide_tags?: string[];
        min_engagement_score?: number;
        max_poll_age_days?: number;
        include_private_polls?: boolean;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        user_id?: string;
        feed_type?: 'personalized' | 'trending' | 'recent' | 'following';
        show_categories?: string[];
        hide_categories?: string[];
        show_tags?: string[];
        hide_tags?: string[];
        min_engagement_score?: number;
        max_poll_age_days?: number;
        include_private_polls?: boolean;
        created_at?: string;
        updated_at?: string;
      };
    };
    feed_interactions: {
      Row: {
        id: string;
        user_id: string;
        poll_id: string;
        interaction_type:
          | 'view'
          | 'vote'
          | 'comment'
          | 'share'
          | 'save'
          | 'hide'
          | 'report';
        interaction_data: Record<string, unknown>;
        created_at: string;
      };
      Insert: {
        id?: string;
        user_id: string;
        poll_id: string;
        interaction_type:
          | 'view'
          | 'vote'
          | 'comment'
          | 'share'
          | 'save'
          | 'hide'
          | 'report';
        interaction_data?: Record<string, unknown>;
        created_at?: string;
      };
      Update: {
        id?: string;
        user_id?: string;
        poll_id?: string;
        interaction_type?:
          | 'view'
          | 'vote'
          | 'comment'
          | 'share'
          | 'save'
          | 'hide'
          | 'report';
        interaction_data?: Record<string, unknown>;
        created_at?: string;
      };
    };
    trending_topics: {
      Row: {
        id: string;
        topic_type: 'category' | 'tag' | 'keyword';
        topic_value: string;
        trending_score: number;
        velocity: number;
        period_start: string;
        period_end: string;
        created_at: string;
      };
      Insert: {
        id?: string;
        topic_type: 'category' | 'tag' | 'keyword';
        topic_value: string;
        trending_score: number;
        velocity?: number;
        period_start: string;
        period_end: string;
        created_at?: string;
      };
      Update: {
        id?: string;
        topic_type?: 'category' | 'tag' | 'keyword';
        topic_value?: string;
        trending_score?: number;
        velocity?: number;
        period_start?: string;
        period_end?: string;
        created_at?: string;
      };
    };
    poll_categories: {
      Row: {
        id: string;
        name: string;
        description: string | null;
        color: string;
        icon: string | null;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        name: string;
        description?: string | null;
        color?: string;
        icon?: string | null;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        name?: string;
        description?: string | null;
        color?: string;
        icon?: string | null;
        created_at?: string;
        updated_at?: string;
      };
    };
    poll_tags: {
      Row: {
        id: string;
        name: string;
        description: string | null;
        usage_count: number;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        name: string;
        description?: string | null;
        usage_count?: number;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        name?: string;
        description?: string | null;
        usage_count?: number;
        created_at?: string;
        updated_at?: string;
      };
    };
    poll_categorizations: {
      Row: {
        id: string;
        poll_id: string;
        category_id: string;
        created_at: string;
      };
      Insert: {
        id?: string;
        poll_id: string;
        category_id: string;
        created_at?: string;
      };
      Update: {
        id?: string;
        poll_id?: string;
        category_id?: string;
        created_at?: string;
      };
    };
    poll_taggings: {
      Row: {
        id: string;
        poll_id: string;
        tag_id: string;
        created_at: string;
      };
      Insert: {
        id?: string;
        poll_id: string;
        tag_id: string;
        created_at?: string;
      };
      Update: {
        id?: string;
        poll_id?: string;
        tag_id?: string;
        created_at?: string;
      };
    };
    user_feed_preferences: {
      Row: {
        id: string;
        user_id: string;
        preferred_categories: string[];
        preferred_tags: string[];
        excluded_categories: string[];
        excluded_tags: string[];
        feed_algorithm:
          | 'chronological'
          | 'popular'
          | 'trending'
          | 'personalized'
          | 'mixed';
        show_following_only: boolean;
        show_public_only: boolean;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        user_id: string;
        preferred_categories?: string[];
        preferred_tags?: string[];
        excluded_categories?: string[];
        excluded_tags?: string[];
        feed_algorithm?:
          | 'chronological'
          | 'popular'
          | 'trending'
          | 'personalized'
          | 'mixed';
        show_following_only?: boolean;
        show_public_only?: boolean;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        user_id?: string;
        preferred_categories?: string[];
        preferred_tags?: string[];
        excluded_categories?: string[];
        excluded_tags?: string[];
        feed_algorithm?:
          | 'chronological'
          | 'popular'
          | 'trending'
          | 'personalized'
          | 'mixed';
        show_following_only?: boolean;
        show_public_only?: boolean;
        created_at?: string;
        updated_at?: string;
      };
    };
    poll_metrics: {
      Row: {
        id: string;
        poll_id: string;
        view_count: number;
        vote_count: number;
        share_count: number;
        comment_count: number;
        engagement_score: number;
        trending_score: number;
        popularity_score: number;
        last_calculated_at: string;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        poll_id: string;
        view_count?: number;
        vote_count?: number;
        share_count?: number;
        comment_count?: number;
        engagement_score?: number;
        trending_score?: number;
        popularity_score?: number;
        last_calculated_at?: string;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        poll_id?: string;
        view_count?: number;
        vote_count?: number;
        share_count?: number;
        comment_count?: number;
        engagement_score?: number;
        trending_score?: number;
        popularity_score?: number;
        last_calculated_at?: string;
        created_at?: string;
        updated_at?: string;
      };
    };
    user_poll_interactions: {
      Row: {
        id: string;
        user_id: string;
        poll_id: string;
        interaction_type:
          | 'view'
          | 'vote'
          | 'share'
          | 'comment'
          | 'save'
          | 'hide';
        created_at: string;
      };
      Insert: {
        id?: string;
        user_id: string;
        poll_id: string;
        interaction_type:
          | 'view'
          | 'vote'
          | 'share'
          | 'comment'
          | 'save'
          | 'hide';
        created_at?: string;
      };
      Update: {
        id?: string;
        user_id?: string;
        poll_id?: string;
        interaction_type?:
          | 'view'
          | 'vote'
          | 'share'
          | 'comment'
          | 'save'
          | 'hide';
        created_at?: string;
      };
    };
    saved_polls: {
      Row: {
        id: string;
        user_id: string;
        poll_id: string;
        created_at: string;
      };
      Insert: {
        id?: string;
        user_id: string;
        poll_id: string;
        created_at?: string;
      };
      Update: {
        id?: string;
        user_id?: string;
        poll_id?: string;
        created_at?: string;
      };
    };
    hidden_polls: {
      Row: {
        id: string;
        user_id: string;
        poll_id: string;
        reason: string | null;
        created_at: string;
      };
      Insert: {
        id?: string;
        user_id: string;
        poll_id: string;
        reason?: string | null;
        created_at?: string;
      };
      Update: {
        id?: string;
        user_id?: string;
        poll_id?: string;
        reason?: string | null;
        created_at?: string;
      };
    };
    feed_cache: {
      Row: {
        id: string;
        user_id: string;
        feed_type: 'personalized' | 'trending' | 'popular' | 'following';
        poll_ids: string[];
        algorithm_version: string;
        cached_at: string;
        expires_at: string;
      };
      Insert: {
        id?: string;
        user_id: string;
        feed_type: 'personalized' | 'trending' | 'popular' | 'following';
        poll_ids: string[];
        algorithm_version?: string;
        cached_at?: string;
        expires_at?: string;
      };
      Update: {
        id?: string;
        user_id?: string;
        feed_type?: 'personalized' | 'trending' | 'popular' | 'following';
        poll_ids?: string[];
        algorithm_version?: string;
        cached_at?: string;
        expires_at?: string;
      };
    };
    error_reports: {
      Row: {
        id: string;
        type:
          | 'network'
          | 'validation'
          | 'system'
          | 'authentication'
          | 'authorization'
          | 'unknown';
        severity: 'low' | 'medium' | 'high' | 'critical';
        message: string;
        user_message: string;
        context: Record<string, unknown> | null;
        stack: string | null;
        user_id: string | null;
        resolved: boolean;
        resolved_at: string | null;
        resolved_by: string | null;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        type:
          | 'network'
          | 'validation'
          | 'system'
          | 'authentication'
          | 'authorization'
          | 'unknown';
        severity: 'low' | 'medium' | 'high' | 'critical';
        message: string;
        user_message: string;
        context?: Record<string, unknown> | null;
        stack?: string | null;
        user_id?: string | null;
        resolved?: boolean;
        resolved_at?: string | null;
        resolved_by?: string | null;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        type?:
          | 'network'
          | 'validation'
          | 'system'
          | 'authentication'
          | 'authorization'
          | 'unknown';
        severity?: 'low' | 'medium' | 'high' | 'critical';
        message?: string;
        user_message?: string;
        context?: Record<string, unknown> | null;
        stack?: string | null;
        user_id?: string | null;
        resolved?: boolean;
        resolved_at?: string | null;
        resolved_by?: string | null;
        created_at?: string;
        updated_at?: string;
      };
    };
    user_feedback: {
      Row: {
        id: string;
        user_id: string;
        type: 'bug' | 'feature' | 'improvement' | 'general';
        title: string;
        description: string;
        priority: 'low' | 'medium' | 'high' | 'urgent';
        status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'duplicate';
        category: string;
        tags: string[];
        attachments: string[];
        votes: number;
        assigned_to: string | null;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        user_id: string;
        type: 'bug' | 'feature' | 'improvement' | 'general';
        title: string;
        description: string;
        priority: 'low' | 'medium' | 'high' | 'urgent';
        status?: 'open' | 'in_progress' | 'resolved' | 'closed' | 'duplicate';
        category?: string;
        tags?: string[];
        attachments?: string[];
        votes?: number;
        assigned_to?: string | null;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        user_id?: string;
        type?: 'bug' | 'feature' | 'improvement' | 'general';
        title?: string;
        description?: string;
        priority?: 'low' | 'medium' | 'high' | 'urgent';
        status?: 'open' | 'in_progress' | 'resolved' | 'closed' | 'duplicate';
        category?: string;
        tags?: string[];
        attachments?: string[];
        votes?: number;
        assigned_to?: string | null;
        created_at?: string;
        updated_at?: string;
      };
    };
    feedback_votes: {
      Row: {
        id: string;
        feedback_id: string;
        user_id: string;
        created_at: string;
      };
      Insert: {
        id?: string;
        feedback_id: string;
        user_id: string;
        created_at?: string;
      };
      Update: {
        id?: string;
        feedback_id?: string;
        user_id?: string;
        created_at?: string;
      };
    };
    feedback_comments: {
      Row: {
        id: string;
        feedback_id: string;
        user_id: string;
        comment: string;
        is_internal: boolean;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        feedback_id: string;
        user_id: string;
        comment: string;
        is_internal?: boolean;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        feedback_id?: string;
        user_id?: string;
        comment?: string;
        is_internal?: boolean;
        created_at?: string;
        updated_at?: string;
      };
    };
    Enums: Record<string, never>;
  };
}
