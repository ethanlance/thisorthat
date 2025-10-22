import {
  generatePollMetaTags,
  generateShareText,
  generateShareUrl,
  generateSocialShareUrls,
  isValidUrl,
  getDomainFromUrl,
  truncateText,
  generatePollPreview,
} from '@/lib/utils/meta-helpers';

describe('meta-helpers', () => {
  const mockPoll = {
    id: 'poll-123',
    description: 'Test Poll',
    option_a_label: 'Option A',
    option_b_label: 'Option B',
    option_a_image_url: 'https://example.com/image-a.jpg',
    option_b_image_url: 'https://example.com/image-b.jpg',
    status: 'active' as const,
    created_at: '2023-01-01T00:00:00Z',
    expires_at: '2023-01-02T00:00:00Z',
  };

  describe('generatePollMetaTags', () => {
    it('should generate meta tags for poll', () => {
      const metaTags = generatePollMetaTags(mockPoll);

      expect(metaTags.title).toBe('Test Poll');
      expect(metaTags.description).toBe(
        'Vote on this poll: Option A vs Option B'
      );
      expect(metaTags.url).toContain('/poll/poll-123');
      expect(metaTags.image).toBe('https://example.com/image-a.jpg');
      expect(metaTags.type).toBe('website');
      expect(metaTags.siteName).toBe('ThisOrThat');
    });

    it('should generate Twitter meta tags', () => {
      const metaTags = generatePollMetaTags(mockPoll);

      expect(metaTags.twitter.card).toBe('summary_large_image');
      expect(metaTags.twitter.title).toBe('Test Poll');
      expect(metaTags.twitter.description).toBe(
        'Vote on this poll: Option A vs Option B'
      );
      expect(metaTags.twitter.image).toBe('https://example.com/image-a.jpg');
    });

    it('should generate Open Graph meta tags', () => {
      const metaTags = generatePollMetaTags(mockPoll);

      expect(metaTags.openGraph.title).toBe('Test Poll');
      expect(metaTags.openGraph.description).toBe(
        'Vote on this poll: Option A vs Option B'
      );
      expect(metaTags.openGraph.url).toContain('/poll/poll-123');
      expect(metaTags.openGraph.type).toBe('website');
      expect(metaTags.openGraph.siteName).toBe('ThisOrThat');
      expect(metaTags.openGraph.images).toHaveLength(1);
      expect(metaTags.openGraph.images[0].url).toBe(
        'https://example.com/image-a.jpg'
      );
    });

    it('should handle poll without labels', () => {
      const pollWithoutLabels = {
        ...mockPoll,
        option_a_label: undefined,
        option_b_label: undefined,
      };
      const metaTags = generatePollMetaTags(pollWithoutLabels);

      expect(metaTags.description).toBe(
        'Vote on this poll: Option A vs Option B'
      );
    });
  });

  describe('generateShareText', () => {
    it('should generate share text', () => {
      const text = generateShareText(mockPoll);

      expect(text).toBe(
        'Check out this poll: "Test Poll" - Option A vs Option B. Vote now!'
      );
    });

    it('should handle poll without labels', () => {
      const pollWithoutLabels = {
        ...mockPoll,
        option_a_label: undefined,
        option_b_label: undefined,
      };
      const text = generateShareText(pollWithoutLabels);

      expect(text).toBe(
        'Check out this poll: "Test Poll" - Option A vs Option B. Vote now!'
      );
    });
  });

  describe('generateShareUrl', () => {
    it('should generate share URL', () => {
      const url = generateShareUrl('poll-123');

      expect(url).toContain('/poll/poll-123');
    });
  });

  describe('generateSocialShareUrls', () => {
    it('should generate social share URLs', () => {
      const urls = generateSocialShareUrls(mockPoll);

      expect(urls.twitter).toContain('twitter.com/intent/tweet');
      expect(urls.facebook).toContain('facebook.com/sharer');
      expect(urls.whatsapp).toContain('wa.me');
      expect(urls.telegram).toContain('t.me/share');
      expect(urls.linkedin).toContain('linkedin.com/sharing');
    });
  });

  describe('isValidUrl', () => {
    it('should validate correct URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('https://example.com/path')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('ftp://example.com')).toBe(false);
    });
  });

  describe('getDomainFromUrl', () => {
    it('should extract domain from URL', () => {
      expect(getDomainFromUrl('https://example.com')).toBe('example.com');
      expect(getDomainFromUrl('https://example.com/path')).toBe('example.com');
      expect(getDomainFromUrl('http://subdomain.example.com')).toBe(
        'subdomain.example.com'
      );
    });

    it('should return empty string for invalid URL', () => {
      expect(getDomainFromUrl('not-a-url')).toBe('');
    });
  });

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const longText = 'This is a very long text that should be truncated';
      const truncated = truncateText(longText, 20);

      expect(truncated).toBe('This is a very lo...');
      expect(truncated.length).toBe(20);
    });

    it('should not truncate short text', () => {
      const shortText = 'Short text';
      const truncated = truncateText(shortText, 20);

      expect(truncated).toBe('Short text');
    });
  });

  describe('generatePollPreview', () => {
    it('should generate poll preview', () => {
      const preview = generatePollPreview(mockPoll);

      expect(preview.title).toBe('Test Poll');
      expect(preview.description).toBe('Vote: Option A vs Option B');
      expect(preview.image).toBe('https://example.com/image-a.jpg');
      expect(preview.url).toContain('/poll/poll-123');
    });

    it('should handle poll without labels', () => {
      const pollWithoutLabels = {
        ...mockPoll,
        option_a_label: undefined,
        option_b_label: undefined,
      };
      const preview = generatePollPreview(pollWithoutLabels);

      expect(preview.description).toBe('Vote: Option A vs Option B');
    });
  });
});
