'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert } from '@/components/ui/alert';
import ImageUpload from '@/components/upload/ImageUpload';
import { uploadPollImage } from '@/lib/storage/image-upload';
import { createClient } from '@/lib/supabase/client';

interface PollFormData {
  optionAImage: File | null;
  optionBImage: File | null;
  optionALabel: string;
  optionBLabel: string;
  description: string;
}

export default function CreatePollPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<PollFormData>({
    optionAImage: null,
    optionBImage: null,
    optionALabel: '',
    optionBLabel: '',
    description: ''
  });

  const [uploadStatus, setUploadStatus] = useState({
    optionA: { status: 'idle' as 'idle' | 'uploading' | 'success' | 'error', progress: 0 },
    optionB: { status: 'idle' as 'idle' | 'uploading' | 'success' | 'error', progress: 0 }
  });

  const handleImageSelect = (option: 'a' | 'b') => (file: File) => {
    setFormData(prev => ({
      ...prev,
      [`option${option.toUpperCase()}Image`]: file
    }));
  };

  const handleImageUpload = async (option: 'a' | 'b') => async (url: string) => {
    setUploadStatus(prev => ({
      ...prev,
      [`option${option.toUpperCase()}`]: { status: 'success', progress: 100 }
    }));
  };

  const handleImageError = (option: 'a' | 'b') => (error: string) => {
    setUploadStatus(prev => ({
      ...prev,
      [`option${option.toUpperCase()}`]: { status: 'error', progress: 0 }
    }));
    setError(error);
  };

  const handleImageRemove = (option: 'a' | 'b') => () => {
    setFormData(prev => ({
      ...prev,
      [`option${option.toUpperCase()}Image`]: null
    }));
    setUploadStatus(prev => ({
      ...prev,
      [`option${option.toUpperCase()}`]: { status: 'idle', progress: 0 }
    }));
  };

  const handleInputChange = (field: keyof PollFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to create a poll');
      return;
    }

    if (!formData.optionAImage || !formData.optionBImage) {
      setError('Please upload both images');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      
      // Create poll record first
      const { data: pollData, error: pollError } = await supabase
        .from('polls')
        .insert({
          creator_id: user.id,
          option_a_label: formData.optionALabel || null,
          option_b_label: formData.optionBLabel || null,
          description: formData.description || null,
          is_public: true,
          status: 'active'
        })
        .select()
        .single();

      if (pollError) throw pollError;

      // Upload images
      const [optionAResult, optionBResult] = await Promise.all([
        uploadPollImage(formData.optionAImage, pollData.id, 'a'),
        uploadPollImage(formData.optionBImage, pollData.id, 'b')
      ]);

      if (!optionAResult.success || !optionBResult.success) {
        throw new Error('Failed to upload images');
      }

      // Update poll with image URLs
      const { error: updateError } = await supabase
        .from('polls')
        .update({
          option_a_image_url: optionAResult.url,
          option_b_image_url: optionBResult.url
        })
        .eq('id', pollData.id);

      if (updateError) throw updateError;

      // Redirect to poll view
      router.push(`/poll/${pollData.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create poll');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert>
          <p>You must be logged in to create a poll.</p>
          <Button 
            onClick={() => router.push('/login')}
            className="mt-2"
          >
            Sign In
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create a Poll</h1>
        <p className="text-muted-foreground">
          Upload two images and let your friends help you decide!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Uploads */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Option A</label>
            <ImageUpload
              option="a"
              onImageSelect={handleImageSelect('a')}
              onUploadComplete={handleImageUpload('a')}
              onError={handleImageError('a')}
              onRemove={handleImageRemove('a')}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Option B</label>
            <ImageUpload
              option="b"
              onImageSelect={handleImageSelect('b')}
              onUploadComplete={handleImageUpload('b')}
              onError={handleImageError('b')}
              onRemove={handleImageRemove('b')}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Labels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="optionALabel" className="text-sm font-medium">
              Option A Label (optional)
            </label>
            <Input
              id="optionALabel"
              value={formData.optionALabel}
              onChange={handleInputChange('optionALabel')}
              placeholder="e.g., Pizza"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="optionBLabel" className="text-sm font-medium">
              Option B Label (optional)
            </label>
            <Input
              id="optionBLabel"
              value={formData.optionBLabel}
              onChange={handleInputChange('optionBLabel')}
              placeholder="e.g., Burger"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium">
            Description (optional)
          </label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={handleInputChange('description')}
            placeholder="What are you trying to decide?"
            rows={3}
            disabled={isSubmitting}
          />
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            {error}
          </Alert>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !formData.optionAImage || !formData.optionBImage}
          >
            {isSubmitting ? 'Creating Poll...' : 'Create Poll'}
          </Button>
        </div>
      </form>
    </div>
  );
}
