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
      comments: {
        Row: {
          id: string;
          poll_id: string;
          user_id: string;
          content: string;
          parent_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          poll_id: string;
          user_id: string;
          content: string;
          parent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          poll_id?: string;
          user_id?: string;
          content?: string;
          parent_id?: string | null;
          created_at?: string;
          updated_at?: string;
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
          achievement_data: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_type: string;
          achievement_data?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          achievement_type?: string;
          achievement_data?: any;
          created_at?: string;
        };
      };
      user_activity: {
        Row: {
          id: string;
          user_id: string;
          activity_type: string;
          activity_data: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_type: string;
          activity_data?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          activity_type?: string;
          activity_data?: any;
          created_at?: string;
        };
      };
    };
    Enums: Record<string, never>;
  };
}
