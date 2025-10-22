import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResultsShareProps {
  pollId: string;
  pollTitle: string;
  voteCounts: { option_a: number; option_b: number };
  optionLabels: { option_a: string; option_b: string };
  className?: string;
}

export default function ResultsShare({
  pollId,
  pollTitle,
  voteCounts,
  optionLabels,
  className,
}: ResultsShareProps) {
  const [shareSuccess, setShareSuccess] = useState(false);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/poll/${pollId}`;
    const shareText = `Check out the results of "${pollTitle}": ${optionLabels.option_a} (${voteCounts.option_a} votes) vs ${optionLabels.option_b} (${voteCounts.option_b} votes)`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Poll Results: ${pollTitle}`,
          text: shareText,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <Button onClick={handleShare} className="w-full flex items-center gap-2">
        {shareSuccess ? (
          <>
            <Check className="h-4 w-4" />
            Results Copied!
          </>
        ) : (
          <>
            <Share2 className="h-4 w-4" />
            Share Results
          </>
        )}
      </Button>

      {shareSuccess && (
        <div className="text-center text-sm text-green-600">
          Results copied to clipboard!
        </div>
      )}
    </div>
  );
}
