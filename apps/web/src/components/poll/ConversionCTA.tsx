'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Eye } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { trackHomepageCTAClick } from '@/lib/analytics/events';

interface ConversionCTAProps {
  className?: string;
  onCreateClick?: () => void;
  onBrowseClick?: () => void;
}

/**
 * Conversion CTA component that appears after a user votes.
 * Encourages users to create their own poll or browse more polls.
 * Primary CTA has a subtle pulse animation after 5 seconds.
 */
export function ConversionCTA({
  className,
  onCreateClick,
  onBrowseClick,
}: ConversionCTAProps) {
  const [showPulse, setShowPulse] = useState(false);

  useEffect(() => {
    // Start pulse animation after 5 seconds to draw attention
    const timer = setTimeout(() => setShowPulse(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleCreateClick = () => {
    trackHomepageCTAClick('create');
    onCreateClick?.();
  };

  const handleBrowseClick = () => {
    trackHomepageCTAClick('browse');
    onBrowseClick?.();
  };

  return (
    <div className={cn('flex flex-col gap-4 w-full max-w-md mx-auto mt-8', className)}>
      {/* Primary CTA: Create Your Own Poll */}
      <Button
        size="lg"
        className={cn(
          'w-full h-14 sm:h-16 text-lg font-semibold',
          showPulse && 'motion-safe:animate-pulse'
        )}
        onClick={handleCreateClick}
        asChild
      >
        <Link href="/poll/create">
          <Plus className="w-5 h-5 mr-2" />
          Create Your Own Poll
        </Link>
      </Button>

      {/* Secondary CTA: Browse Polls */}
      <Button
        variant="outline"
        size="lg"
        className="w-full h-12"
        onClick={handleBrowseClick}
        asChild
      >
        <Link href="/polls">
          <Eye className="w-5 h-5 mr-2" />
          Browse More Polls
        </Link>
      </Button>

      {/* Subtle encouragement text */}
      <p className="text-sm text-center text-muted-foreground mt-2">
        Join thousands making decisions easier ✨
      </p>
    </div>
  );
}

export default ConversionCTA;

