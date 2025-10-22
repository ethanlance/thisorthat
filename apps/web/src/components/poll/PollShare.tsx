import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Twitter, Facebook, MessageCircle, Send, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PollShareProps {
  pollId: string;
  pollTitle: string;
  pollDescription?: string;
  pollImages: { option_a: string; option_b: string };
  className?: string;
}

export default function PollShare({ 
  pollId, 
  pollTitle, 
  pollDescription,
  pollImages,
  className 
}: PollShareProps) {
  const [shareSuccess, setShareSuccess] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const shareUrl = `${window.location.origin}/poll/${pollId}`;
  const shareText = pollDescription 
    ? `${pollTitle}: ${pollDescription}`
    : pollTitle;

  const handleNativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: pollTitle,
          text: shareText,
          url: shareUrl
        });
        await trackShare(pollId, 'native');
      } else {
        await handleClipboardShare();
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        setShareError('Failed to share poll');
      }
    }
  };

  const handleClipboardShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
      await trackShare(pollId, 'clipboard');
    } catch (error) {
      setShareError('Failed to copy link');
    }
  };

  const handleSocialShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);
    
    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
      trackShare(pollId, platform);
    }
  };

  const trackShare = async (pollId: string, method: string) => {
    try {
      // Track share analytics
      const response = await fetch('/api/analytics/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pollId,
          method,
          timestamp: new Date().toISOString()
        }),
      });
      
      if (!response.ok) {
        console.warn('Failed to track share analytics');
      }
    } catch (error) {
      console.warn('Failed to track share analytics:', error);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Share Button */}
      <Button
        onClick={handleNativeShare}
        className="w-full flex items-center gap-2"
      >
        {shareSuccess ? (
          <>
            <Check className="h-4 w-4" />
            Link Copied!
          </>
        ) : (
          <>
            <Share2 className="h-4 w-4" />
            Share Poll
          </>
        )}
      </Button>

      {/* Social Media Options */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSocialShare('twitter')}
          className="flex items-center gap-2"
        >
          <Twitter className="h-4 w-4" />
          Twitter
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSocialShare('facebook')}
          className="flex items-center gap-2"
        >
          <Facebook className="h-4 w-4" />
          Facebook
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSocialShare('whatsapp')}
          className="flex items-center gap-2"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSocialShare('telegram')}
          className="flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          Telegram
        </Button>
      </div>

      {/* Copy Link Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClipboardShare}
        className="w-full flex items-center gap-2"
      >
        <Copy className="h-4 w-4" />
        Copy Link
      </Button>

      {/* Success/Error Messages */}
      {shareSuccess && (
        <div className="text-center text-sm text-green-600">
          Poll link copied to clipboard!
        </div>
      )}
      {shareError && (
        <div className="text-center text-sm text-red-600">
          {shareError}
        </div>
      )}
    </div>
  );
}
