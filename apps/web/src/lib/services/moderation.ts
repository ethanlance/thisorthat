import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database';

type ContentReportInsert =
  Database['public']['Tables']['content_reports']['Insert'];
type ModerationActionInsert =
  Database['public']['Tables']['moderation_actions']['Insert'];
type ContentClassificationInsert =
  Database['public']['Tables']['content_classifications']['Insert'];
type ContentAppealInsert =
  Database['public']['Tables']['content_appeals']['Insert'];

export interface ContentModerationResult {
  isApproved: boolean;
  classification: 'safe' | 'questionable' | 'inappropriate' | 'spam';
  confidence: number;
  reason?: string;
  requiresHumanReview: boolean;
}

export interface ModerationQueueItem {
  report_id: string;
  content_type: string;
  content_id: string;
  report_category: string;
  description: string | null;
  reporter_email: string | null;
  created_at: string;
  status: string;
}

export interface ModerationStats {
  total_reports: number;
  pending_reports: number;
  resolved_reports: number;
  total_actions: number;
  appeals_pending: number;
}

export class ModerationService {
  /**
   * Submit a content report
   */
  static async submitReport(
    reporterId: string,
    contentType: 'poll' | 'comment' | 'user' | 'image',
    contentId: string,
    reportCategory:
      | 'inappropriate_content'
      | 'spam'
      | 'harassment'
      | 'violence'
      | 'hate_speech'
      | 'other',
    description?: string
  ): Promise<boolean> {
    try {
      const supabase = createClient();

      const reportData: ContentReportInsert = {
        reporter_id: reporterId,
        content_type: contentType,
        content_id: contentId,
        report_category: reportCategory,
        description: description || null,
        status: 'pending',
      };

      const { error } = await supabase
        .from('content_reports')
        .insert(reportData);

      if (error) {
        console.error('Error submitting report:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in submitReport:', error);
      return false;
    }
  }

  /**
   * Get moderation queue for moderators
   */
  static async getModerationQueue(
    limit: number = 50,
    offset: number = 0
  ): Promise<ModerationQueueItem[]> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase.rpc('get_moderation_queue', {
        p_limit: limit,
        p_offset: offset,
      });

      if (error) {
        console.error('Error fetching moderation queue:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getModerationQueue:', error);
      return [];
    }
  }

  /**
   * Take moderation action
   */
  static async takeModerationAction(
    moderatorId: string,
    contentType: 'poll' | 'comment' | 'user' | 'image',
    contentId: string,
    actionType:
      | 'approve'
      | 'reject'
      | 'delete'
      | 'hide'
      | 'escalate'
      | 'warn_user',
    reason?: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<boolean> {
    try {
      const supabase = createClient();

      const actionData: ModerationActionInsert = {
        moderator_id: moderatorId,
        content_type: contentType,
        content_id: contentId,
        action_type: actionType,
        reason: reason || null,
        severity,
      };

      const { error } = await supabase
        .from('moderation_actions')
        .insert(actionData);

      if (error) {
        console.error('Error taking moderation action:', error);
        return false;
      }

      // Update the content report status if it exists
      if (actionType === 'approve' || actionType === 'reject') {
        await supabase
          .from('content_reports')
          .update({
            status: actionType === 'approve' ? 'resolved' : 'dismissed',
            reviewed_by: moderatorId,
            reviewed_at: new Date().toISOString(),
          })
          .eq('content_type', contentType)
          .eq('content_id', contentId)
          .eq('status', 'pending');
      }

      return true;
    } catch (error) {
      console.error('Error in takeModerationAction:', error);
      return false;
    }
  }

  /**
   * Classify content using automated detection
   */
  static async classifyContent(
    contentType: 'poll' | 'comment' | 'image',
    contentId: string,
    contentData?: string | File
  ): Promise<ContentModerationResult> {
    try {
      // For now, implement basic content classification
      // In production, this would integrate with services like Google Cloud Vision API

      let classification: 'safe' | 'questionable' | 'inappropriate' | 'spam' =
        'safe';
      let confidence = 0.9;
      let reason: string | undefined;
      let requiresHumanReview = false;

      if (contentType === 'comment' && typeof contentData === 'string') {
        // Basic text analysis for comments
        const text = contentData.toLowerCase();

        // Check for spam keywords
        const spamKeywords = ['spam', 'scam', 'fake', 'click here', 'buy now'];
        const hasSpamKeywords = spamKeywords.some(keyword =>
          text.includes(keyword)
        );

        // Check for inappropriate content
        const inappropriateKeywords = ['hate', 'violence', 'harassment'];
        const hasInappropriateContent = inappropriateKeywords.some(keyword =>
          text.includes(keyword)
        );

        if (hasSpamKeywords) {
          classification = 'spam';
          confidence = 0.8;
          reason = 'Contains spam keywords';
        } else if (hasInappropriateContent) {
          classification = 'inappropriate';
          confidence = 0.7;
          reason = 'Contains inappropriate content';
          requiresHumanReview = true;
        }
      }

      // Store classification result
      const supabase = createClient();
      const classificationData: ContentClassificationInsert = {
        content_type: contentType,
        content_id: contentId,
        classification,
        confidence_score: confidence,
        detection_method: 'automated',
        details: {
          reason,
          requires_human_review: requiresHumanReview,
        },
      };

      await supabase.from('content_classifications').insert(classificationData);

      return {
        isApproved: classification === 'safe',
        classification,
        confidence,
        reason,
        requiresHumanReview,
      };
    } catch (error) {
      console.error('Error in classifyContent:', error);
      return {
        isApproved: false,
        classification: 'questionable',
        confidence: 0.5,
        reason: 'Classification failed',
        requiresHumanReview: true,
      };
    }
  }

  /**
   * Get moderation statistics
   */
  static async getModerationStats(): Promise<ModerationStats | null> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase.rpc('get_moderation_stats');

      if (error) {
        console.error('Error fetching moderation stats:', error);
        return null;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Error in getModerationStats:', error);
      return null;
    }
  }

  /**
   * Submit content appeal
   */
  static async submitAppeal(
    appealerId: string,
    moderationActionId: string,
    appealReason: string
  ): Promise<boolean> {
    try {
      const supabase = createClient();

      const appealData: ContentAppealInsert = {
        appealer_id: appealerId,
        moderation_action_id: moderationActionId,
        appeal_reason: appealReason,
        status: 'pending',
      };

      const { error } = await supabase
        .from('content_appeals')
        .insert(appealData);

      if (error) {
        console.error('Error submitting appeal:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in submitAppeal:', error);
      return false;
    }
  }

  /**
   * Get user's moderation history
   */
  static async getUserModerationHistory(
    userId: string
  ): Promise<Record<string, unknown>[]> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('user_moderation_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user moderation history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserModerationHistory:', error);
      return [];
    }
  }

  /**
   * Check if user has moderator permissions
   */
  static async isModerator(userId: string): Promise<boolean> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('auth.users')
        .select('raw_user_meta_data')
        .eq('id', userId)
        .single();

      if (error || !data) {
        return false;
      }

      return data.raw_user_meta_data?.role === 'moderator';
    } catch (error) {
      console.error('Error checking moderator status:', error);
      return false;
    }
  }

  /**
   * Get content guidelines
   */
  static async getContentGuidelines(): Promise<{
    guidelines: string;
    examples: { appropriate: string[]; inappropriate: string[] };
    consequences: string;
  }> {
    // For now, return static guidelines
    // In production, this would be stored in the database
    return {
      guidelines: `
        Our community guidelines help maintain a safe and welcoming environment for all users.
        
        ACCEPTABLE CONTENT:
        - Polls about everyday decisions and preferences
        - Respectful discussions and comments
        - Original content that you have the right to share
        - Content that follows local laws and regulations
        
        PROHIBITED CONTENT:
        - Adult content, nudity, or sexual material
        - Violence, graphic content, or disturbing imagery
        - Hate speech, harassment, or bullying
        - Spam, scams, or misleading content
        - Copyrighted material without permission
        - Personal information of others
        - Content that promotes illegal activities
        
        CONSEQUENCES:
        - First violation: Warning and content removal
        - Repeated violations: Temporary account suspension
        - Severe violations: Permanent account ban
        - Appeals process available for disputed actions
      `,
      examples: {
        appropriate: [
          'Which pizza topping is better: pepperoni or mushrooms?',
          'Should I get a dog or a cat?',
          "What's your favorite season: summer or winter?",
        ],
        inappropriate: [
          'Content with explicit sexual material',
          'Polls promoting violence or hate',
          'Spam or misleading advertisements',
        ],
      },
      consequences: `
        Violations of our community guidelines may result in:
        - Content removal
        - Account warnings
        - Temporary suspension
        - Permanent ban for severe violations
        
        You can appeal moderation decisions through our appeals process.
      `,
    };
  }
}
