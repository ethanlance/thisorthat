import { createClient } from '@/lib/supabase/client';
import { ContentDetectionService, ContentDetectionResult } from '@/lib/services/content-detection';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  moderationResult?: ContentDetectionResult;
}

export const uploadPollImage = async (
  file: File,
  pollId: string,
  option: 'a' | 'b'
): Promise<UploadResult> => {
  try {
    const supabase = createClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `${pollId}-${option}.${fileExt}`;

    // First, scan the image for inappropriate content
    const moderationResult = await ContentDetectionService.scanContent(
      'image',
      `${pollId}-${option}`,
      file
    );

    // If content is inappropriate, reject the upload
    if (!moderationResult.isApproved) {
      return {
        success: false,
        error: `Content rejected: ${moderationResult.reason || 'Inappropriate content detected'}`,
        moderationResult,
      };
    }

    const { data, error } = await supabase.storage
      .from('poll-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('poll-images')
      .getPublicUrl(fileName);

    return { 
      success: true, 
      url: urlData.publicUrl,
      moderationResult 
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
};

export const deletePollImage = async (
  pollId: string,
  option: 'a' | 'b'
): Promise<UploadResult> => {
  try {
    const supabase = createClient();
    const fileName = `${pollId}-${option}`;

    const { error } = await supabase.storage
      .from('poll-images')
      .remove([fileName]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    };
  }
};
