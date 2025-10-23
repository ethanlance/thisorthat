'use client';

import Image from 'next/image';
import { PollWithResults } from '@/lib/services/polls';
import { cn } from '@/lib/utils';

interface PollImagesProps {
  poll: PollWithResults;
  showResults?: boolean;
  className?: string;
}

export default function PollImages({
  poll,
  showResults = false,
  className,
}: PollImagesProps) {
  const totalVotes = poll.vote_counts.option_a + poll.vote_counts.option_b;
  const optionAPercentage =
    totalVotes > 0
      ? Math.round((poll.vote_counts.option_a / totalVotes) * 100)
      : 0;
  const optionBPercentage =
    totalVotes > 0
      ? Math.round((poll.vote_counts.option_b / totalVotes) * 100)
      : 0;

  return (
    <div className={cn('grid grid-cols-2 gap-4 mb-6', className)}>
      {/* Option A */}
      <div className="text-center">
        <div className={cn(
          "relative mb-3 h-48 sm:h-64 rounded-xl overflow-hidden",
          showResults && totalVotes > 0 && optionAPercentage > optionBPercentage && "ring-2 ring-primary shadow-primary-lg"
        )}>
          <Image
            src={poll.option_a_image_url}
            alt={poll.option_a_label || 'Option A'}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 400px, 500px"
            className="object-cover"
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2Y1ZjVmNSIvPjwvc3ZnPg=="
          />

          {/* Label overlay with gradient for readability */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent pt-12 pb-3 px-3">
            <h3 className="font-semibold text-lg sm:text-xl text-white drop-shadow-lg">
              {poll.option_a_label || 'Option A'}
            </h3>
          </div>

          {/* Results overlay */}
          {showResults && totalVotes > 0 && (
            <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] flex items-center justify-center">
              <div className="text-center text-white drop-shadow-2xl">
                <div className="text-4xl font-bold mb-1">{optionAPercentage}%</div>
                <div className="text-sm font-medium">
                  {poll.vote_counts.option_a} vote{poll.vote_counts.option_a !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Option B */}
      <div className="text-center">
        <div className={cn(
          "relative mb-3 h-48 sm:h-64 rounded-xl overflow-hidden",
          showResults && totalVotes > 0 && optionBPercentage > optionAPercentage && "ring-2 ring-primary shadow-primary-lg"
        )}>
          <Image
            src={poll.option_b_image_url}
            alt={poll.option_b_label || 'Option B'}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 400px, 500px"
            className="object-cover"
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2Y1ZjVmNSIvPjwvc3ZnPg=="
          />

          {/* Label overlay with gradient for readability */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent pt-12 pb-3 px-3">
            <h3 className="font-semibold text-lg sm:text-xl text-white drop-shadow-lg">
              {poll.option_b_label || 'Option B'}
            </h3>
          </div>

          {/* Results overlay */}
          {showResults && totalVotes > 0 && (
            <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] flex items-center justify-center">
              <div className="text-center text-white drop-shadow-2xl">
                <div className="text-4xl font-bold mb-1">{optionBPercentage}%</div>
                <div className="text-sm font-medium">
                  {poll.vote_counts.option_b} vote{poll.vote_counts.option_b !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
