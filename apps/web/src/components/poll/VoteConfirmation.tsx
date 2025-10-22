'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoteConfirmationProps {
  choice: 'option_a' | 'option_b';
  optionLabel: string;
  onClose?: () => void;
  onShare?: () => void;
  showShareButton?: boolean;
  className?: string;
}

export default function VoteConfirmation({ 
  choice, 
  optionLabel, 
  onClose,
  onShare,
  showShareButton = true,
  className 
}: VoteConfirmationProps) {
  // Auto-close after 3 seconds if no interaction
  useEffect(() => {
    if (!onClose) return;

    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleShare = () => {
    if (onShare) {
      onShare();
    } else {
      // Default share behavior
      const shareUrl = window.location.href;
      navigator.clipboard.writeText(shareUrl).catch(console.error);
    }
  };

  return (
    <div className={cn(
      'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4',
      className
    )}>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full text-center shadow-xl">
        {/* Success Icon */}
        <div className="mb-4">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          
          {/* Success Message */}
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
            Vote Submitted!
          </h3>
          
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            You voted for <strong className="text-gray-900 dark:text-gray-100">{optionLabel}</strong>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {showShareButton && (
            <Button
              onClick={handleShare}
              variant="outline"
              className="w-full flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share Poll
            </Button>
          )}
          
          <Button 
            onClick={onClose} 
            className="w-full"
          >
            Continue
          </Button>
        </div>

        {/* Auto-close indicator */}
        {onClose && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            This will close automatically in a few seconds
          </p>
        )}
      </div>
    </div>
  );
}
