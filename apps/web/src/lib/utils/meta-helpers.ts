export interface PollMetaTags {
  title: string;
  description: string;
  url: string;
  image: string;
  type: string;
  siteName: string;
  twitter: {
    card: string;
    title: string;
    description: string;
    image: string;
  };
  openGraph: {
    title: string;
    description: string;
    url: string;
    type: string;
    siteName: string;
    images: Array<{
      url: string;
      width: number;
      height: number;
      alt: string;
    }>;
  };
}

export interface Poll {
  id: string;
  description: string | null;
  option_a_label?: string | null;
  option_b_label?: string | null;
  option_a_image_url: string;
  option_b_image_url?: string;
  status: 'active' | 'closed' | 'deleted';
  created_at: string;
  expires_at?: string;
}

export const generatePollMetaTags = (poll: Poll): PollMetaTags => {
  const pollUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://thisorthat.app'}/poll/${poll.id}`;
  const pollTitle = poll.description || 'ThisOrThat Poll';
  const pollDescription = `Vote on this poll: ${poll.option_a_label || 'Option A'} vs ${poll.option_b_label || 'Option B'}`;
  const pollImage = poll.option_a_image_url; // Use first image as preview

  return {
    title: pollTitle,
    description: pollDescription,
    url: pollUrl,
    image: pollImage,
    type: 'website',
    siteName: 'ThisOrThat',
    twitter: {
      card: 'summary_large_image',
      title: pollTitle,
      description: pollDescription,
      image: pollImage,
    },
    openGraph: {
      title: pollTitle,
      description: pollDescription,
      url: pollUrl,
      type: 'website',
      siteName: 'ThisOrThat',
      images: [
        {
          url: pollImage,
          width: 1200,
          height: 630,
          alt: pollTitle,
        },
      ],
    },
  };
};

export const generateShareText = (poll: Poll): string => {
  const pollTitle = poll.description || 'ThisOrThat Poll';
  const optionA = poll.option_a_label || 'Option A';
  const optionB = poll.option_b_label || 'Option B';

  return `Check out this poll: "${pollTitle}" - ${optionA} vs ${optionB}. Vote now!`;
};

export const generateShareUrl = (pollId: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thisorthat.app';
  return `${baseUrl}/poll/${pollId}`;
};

export const generateSocialShareUrls = (
  poll: Poll
): {
  twitter: string;
  facebook: string;
  whatsapp: string;
  telegram: string;
  linkedin: string;
} => {
  const shareUrl = generateShareUrl(poll.id);
  const shareText = generateShareText(poll);

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(shareText);

  return {
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  };
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const getDomainFromUrl = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

export const generatePollPreview = (
  poll: Poll
): {
  title: string;
  description: string;
  image: string;
  url: string;
} => {
  return {
    title: poll.description || 'ThisOrThat Poll',
    description: `Vote: ${poll.option_a_label || 'Option A'} vs ${poll.option_b_label || 'Option B'}`,
    image: poll.option_a_image_url,
    url: generateShareUrl(poll.id),
  };
};
