import { createClient } from '@/lib/supabase/client';

export interface ShareAnalytics {
  pollId: string;
  method: string;
  timestamp: string;
  userAgent?: string;
  referrer?: string;
}

export interface PollAccess {
  pollId: string;
  referrer?: string;
  userAgent?: string;
  timestamp: string;
}

export class SharingService {
  static async trackShare(analytics: ShareAnalytics): Promise<void> {
    try {
      const supabase = createClient();
      
      await supabase
        .from('poll_shares')
        .insert({
          poll_id: analytics.pollId,
          method: analytics.method,
          created_at: analytics.timestamp,
          user_agent: analytics.userAgent || navigator.userAgent,
          referrer: analytics.referrer || document.referrer
        });
    } catch (error) {
      console.error('Failed to track share:', error);
    }
  }

  static async trackPollAccess(access: PollAccess): Promise<void> {
    try {
      const supabase = createClient();
      
      await supabase
        .from('poll_access')
        .insert({
          poll_id: access.pollId,
          referrer: access.referrer || document.referrer,
          user_agent: access.userAgent || navigator.userAgent,
          created_at: access.timestamp
        });
    } catch (error) {
      console.error('Failed to track poll access:', error);
    }
  }

  static async getPollAnalytics(pollId: string): Promise<{
    totalShares: number;
    totalAccess: number;
    shareMethods: Record<string, number>;
    referrers: Record<string, number>;
    recentShares: Array<{ method: string; timestamp: string }>;
    recentAccess: Array<{ referrer: string; timestamp: string }>;
  } | null> {
    try {
      const supabase = createClient();
      
      const { data: shares } = await supabase
        .from('poll_shares')
        .select('method, created_at')
        .eq('poll_id', pollId)
        .order('created_at', { ascending: false })
        .limit(50);

      const { data: access } = await supabase
        .from('poll_access')
        .select('referrer, created_at')
        .eq('poll_id', pollId)
        .order('created_at', { ascending: false })
        .limit(50);

      const shareMethods = shares?.reduce((acc, share) => {
        acc[share.method] = (acc[share.method] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const referrers = access?.reduce((acc, access) => {
        acc[access.referrer] = (acc[access.referrer] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        totalShares: shares?.length || 0,
        totalAccess: access?.length || 0,
        shareMethods,
        referrers,
        recentShares: shares?.map(s => ({ method: s.method, timestamp: s.created_at })) || [],
        recentAccess: access?.map(a => ({ referrer: a.referrer, timestamp: a.created_at })) || []
      };
    } catch (error) {
      console.error('Failed to get poll analytics:', error);
      return null;
    }
  }

  static async generateShareableLink(pollId: string): Promise<string> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    return `${baseUrl}/poll/${pollId}`;
  }

  static async generateShareText(pollTitle: string, pollDescription?: string): Promise<string> {
    if (pollDescription) {
      return `${pollTitle}: ${pollDescription}`;
    }
    return pollTitle;
  }

  static async generateSocialShareUrls(pollId: string, pollTitle: string, pollDescription?: string): Promise<{
    twitter: string;
    facebook: string;
    whatsapp: string;
    telegram: string;
  }> {
    const shareUrl = await this.generateShareableLink(pollId);
    const shareText = await this.generateShareText(pollTitle, pollDescription);
    
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);
    
    return {
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`
    };
  }
}
