import { createClient } from '@/lib/supabase/client';
import { ModerationService } from './moderation';

export interface ContentDetectionResult {
  isApproved: boolean;
  classification: 'safe' | 'questionable' | 'inappropriate' | 'spam';
  confidence: number;
  reason?: string;
  requiresHumanReview: boolean;
  detectedCategories?: string[];
  adultContent?: boolean;
  violenceContent?: boolean;
  hateSpeech?: boolean;
}

export interface ImageDetectionResult {
  safeSearch: {
    adult: 'VERY_UNLIKELY' | 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'VERY_LIKELY';
    violence: 'VERY_UNLIKELY' | 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'VERY_LIKELY';
    racy: 'VERY_UNLIKELY' | 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'VERY_LIKELY';
  };
  labels: Array<{
    description: string;
    score: number;
  }>;
}

export class ContentDetectionService {
  private static readonly GOOGLE_CLOUD_VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';
  private static readonly AWS_REKOGNITION_API_URL = 'https://rekognition.us-east-1.amazonaws.com';

  /**
   * Detect inappropriate content in an image using Google Cloud Vision API
   */
  static async detectImageContent(
    imageUrl: string,
    apiKey?: string
  ): Promise<ContentDetectionResult> {
    try {
      // For development, use mock detection
      if (process.env.NODE_ENV === 'development' || !apiKey) {
        return this.mockImageDetection(imageUrl);
      }

      const response = await fetch(
        `${this.GOOGLE_CLOUD_VISION_API_URL}?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                image: {
                  source: {
                    imageUri: imageUrl,
                  },
                },
                features: [
                  {
                    type: 'SAFE_SEARCH_DETECTION',
                    maxResults: 1,
                  },
                  {
                    type: 'LABEL_DETECTION',
                    maxResults: 10,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        console.error('Google Vision API error:', await response.text());
        return this.mockImageDetection(imageUrl);
      }

      const data = await response.json();
      const result = data.responses?.[0];

      if (!result) {
        return this.mockImageDetection(imageUrl);
      }

      return this.processGoogleVisionResult(result);
    } catch (error) {
      console.error('Error in image content detection:', error);
      return this.mockImageDetection(imageUrl);
    }
  }

  /**
   * Detect inappropriate content in text using basic keyword analysis
   */
  static async detectTextContent(
    text: string,
    contentType: 'poll' | 'comment'
  ): Promise<ContentDetectionResult> {
    const textLower = text.toLowerCase();

    // Spam detection
    const spamKeywords = [
      'spam',
      'scam',
      'fake',
      'click here',
      'buy now',
      'free money',
      'win money',
      'earn money',
      'make money',
      'get rich',
    ];

    const hasSpamKeywords = spamKeywords.some(keyword =>
      textLower.includes(keyword)
    );

    if (hasSpamKeywords) {
      return {
        isApproved: false,
        classification: 'spam',
        confidence: 0.8,
        reason: 'Contains spam keywords',
        requiresHumanReview: false,
      };
    }

    // Inappropriate content detection
    const inappropriateKeywords = [
      'hate',
      'violence',
      'harassment',
      'bully',
      'threat',
      'kill',
      'die',
      'stupid',
      'idiot',
      'moron',
    ];

    const hasInappropriateContent = inappropriateKeywords.some(keyword =>
      textLower.includes(keyword)
    );

    if (hasInappropriateContent) {
      return {
        isApproved: false,
        classification: 'inappropriate',
        confidence: 0.7,
        reason: 'Contains inappropriate language',
        requiresHumanReview: true,
      };
    }

    // Hate speech detection
    const hateSpeechKeywords = [
      'racist',
      'sexist',
      'homophobic',
      'transphobic',
      'discrimination',
      'prejudice',
    ];

    const hasHateSpeech = hateSpeechKeywords.some(keyword =>
      textLower.includes(keyword)
    );

    if (hasHateSpeech) {
      return {
        isApproved: false,
        classification: 'inappropriate',
        confidence: 0.9,
        reason: 'Contains hate speech',
        requiresHumanReview: true,
      };
    }

    return {
      isApproved: true,
      classification: 'safe',
      confidence: 0.9,
      requiresHumanReview: false,
    };
  }

  /**
   * Process Google Vision API result
   */
  private static processGoogleVisionResult(
    result: any
  ): ContentDetectionResult {
    const safeSearch = result.safeSearchAnnotation;
    const labels = result.labelAnnotations || [];

    // Check for adult content
    const adultLikelihood = safeSearch?.adult || 'VERY_UNLIKELY';
    const violenceLikelihood = safeSearch?.violence || 'VERY_UNLIKELY';
    const racyLikelihood = safeSearch?.racy || 'VERY_UNLIKELY';

    const adultContent = ['LIKELY', 'VERY_LIKELY'].includes(adultLikelihood);
    const violenceContent = ['LIKELY', 'VERY_LIKELY'].includes(violenceLikelihood);
    const racyContent = ['LIKELY', 'VERY_LIKELY'].includes(racyLikelihood);

    // Determine classification
    let classification: 'safe' | 'questionable' | 'inappropriate' | 'spam' = 'safe';
    let confidence = 0.9;
    let reason: string | undefined;
    let requiresHumanReview = false;

    if (adultContent || violenceContent) {
      classification = 'inappropriate';
      confidence = 0.9;
      reason = 'Contains adult or violent content';
      requiresHumanReview = false;
    } else if (racyContent) {
      classification = 'questionable';
      confidence = 0.7;
      reason = 'Contains potentially inappropriate content';
      requiresHumanReview = true;
    }

    // Check labels for additional context
    const detectedCategories = labels
      .filter((label: any) => label.score > 0.7)
      .map((label: any) => label.description);

    return {
      isApproved: classification === 'safe',
      classification,
      confidence,
      reason,
      requiresHumanReview,
      detectedCategories,
      adultContent,
      violenceContent,
      hateSpeech: false, // Google Vision doesn't detect hate speech directly
    };
  }

  /**
   * Mock image detection for development
   */
  private static mockImageDetection(imageUrl: string): ContentDetectionResult {
    // Simple mock based on URL patterns
    const url = imageUrl.toLowerCase();

    if (url.includes('adult') || url.includes('nsfw')) {
      return {
        isApproved: false,
        classification: 'inappropriate',
        confidence: 0.9,
        reason: 'Contains adult content',
        requiresHumanReview: false,
        adultContent: true,
        violenceContent: false,
        hateSpeech: false,
      };
    }

    if (url.includes('violence') || url.includes('gore')) {
      return {
        isApproved: false,
        classification: 'inappropriate',
        confidence: 0.9,
        reason: 'Contains violent content',
        requiresHumanReview: false,
        adultContent: false,
        violenceContent: true,
        hateSpeech: false,
      };
    }

    return {
      isApproved: true,
      classification: 'safe',
      confidence: 0.9,
      requiresHumanReview: false,
      adultContent: false,
      violenceContent: false,
      hateSpeech: false,
    };
  }

  /**
   * Scan content during upload and store classification
   */
  static async scanContent(
    contentType: 'poll' | 'comment' | 'image',
    contentId: string,
    contentData?: string | File
  ): Promise<ContentDetectionResult> {
    try {
      let result: ContentDetectionResult;

      if (contentType === 'image' && contentData instanceof File) {
        // For image files, we'll need to upload to Supabase first to get URL
        const supabase = createClient();
        const fileExt = contentData.name.split('.').pop();
        const fileName = `${contentId}.${fileExt}`;
        const filePath = `moderation-scans/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, contentData);

        if (uploadError) {
          console.error('Error uploading image for scanning:', uploadError);
          return {
            isApproved: false,
            classification: 'questionable',
            confidence: 0.5,
            reason: 'Failed to process image',
            requiresHumanReview: true,
          };
        }

        const { data: urlData } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);

        result = await this.detectImageContent(urlData.publicUrl);
      } else if (contentType === 'comment' && typeof contentData === 'string') {
        result = await this.detectTextContent(contentData, 'comment');
      } else if (contentType === 'poll' && typeof contentData === 'string') {
        result = await this.detectTextContent(contentData, 'poll');
      } else {
        // Default safe result for unknown content types
        result = {
          isApproved: true,
          classification: 'safe',
          confidence: 0.9,
          requiresHumanReview: false,
        };
      }

      // Store classification result
      await ModerationService.classifyContent(contentType, contentId, contentData);

      return result;
    } catch (error) {
      console.error('Error scanning content:', error);
      return {
        isApproved: false,
        classification: 'questionable',
        confidence: 0.5,
        reason: 'Content scanning failed',
        requiresHumanReview: true,
      };
    }
  }

  /**
   * Get content detection statistics
   */
  static async getDetectionStats(): Promise<{
    totalScans: number;
    safeContent: number;
    inappropriateContent: number;
    spamContent: number;
    humanReviewRequired: number;
  }> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('content_classifications')
        .select('classification, detection_method');

      if (error) {
        console.error('Error fetching detection stats:', error);
        return {
          totalScans: 0,
          safeContent: 0,
          inappropriateContent: 0,
          spamContent: 0,
          humanReviewRequired: 0,
        };
      }

      const stats = {
        totalScans: data.length,
        safeContent: data.filter(c => c.classification === 'safe').length,
        inappropriateContent: data.filter(c => c.classification === 'inappropriate').length,
        spamContent: data.filter(c => c.classification === 'spam').length,
        humanReviewRequired: data.filter(c => c.details?.requires_human_review).length,
      };

      return stats;
    } catch (error) {
      console.error('Error getting detection stats:', error);
      return {
        totalScans: 0,
        safeContent: 0,
        inappropriateContent: 0,
        spamContent: 0,
        humanReviewRequired: 0,
      };
    }
  }
}
