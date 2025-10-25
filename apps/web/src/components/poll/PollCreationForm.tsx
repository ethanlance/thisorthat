'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert } from '@/components/ui/alert';
import {
  Form,
  FormField,
  FormLabel,
  FormError,
  FormDescription,
} from '@/components/ui/form';
import ImageUpload from '@/components/upload/ImageUpload';
import PollPrivacySettings, { PollPrivacySettings as PrivacySettings } from '@/components/privacy/PollPrivacySettings';
import { uploadPollImage } from '@/lib/storage/image-upload';
import { PollsService } from '@/lib/services/polls';
import { PollPrivacyService } from '@/lib/services/poll-privacy';
import {
  PollFormData,
  validatePollForm,
  validateField,
} from '@/lib/validation/poll-validation';

interface PollCreationFormProps {
  onSuccess?: (pollId: string) => void;
  onCancel?: () => void;
}

export default function PollCreationForm({
  onSuccess,
  onCancel,
}: PollCreationFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<PollFormData>({
    optionAImage: null,
    optionBImage: null,
    optionALabel: '',
    optionBLabel: '',
    description: '',
  });

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    privacy_level: 'public',
  });

  const [, setUploadStatus] = useState({
    optionA: {
      status: 'idle' as 'idle' | 'uploading' | 'success' | 'error',
      progress: 0,
    },
    optionB: {
      status: 'idle' as 'idle' | 'uploading' | 'success' | 'error',
      progress: 0,
    },
  });

  const handleImageSelect = (option: 'a' | 'b') => (file: File) => {
    setFormData(prev => ({
      ...prev,
      [`option${option.toUpperCase()}Image`]: file,
    }));

    // Clear field error when image is selected
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`option${option.toUpperCase()}Image`];
      return newErrors;
    });
  };

  const handleImageUpload = (option: 'a' | 'b') => () => {
    setUploadStatus(prev => ({
      ...prev,
      [`option${option.toUpperCase()}`]: { status: 'success', progress: 100 },
    }));
  };

  const handleImageError = (option: 'a' | 'b') => (error: string) => {
    setUploadStatus(prev => ({
      ...prev,
      [`option${option.toUpperCase()}`]: { status: 'error', progress: 0 },
    }));
    setError(error);
  };

  const handleImageRemove = (option: 'a' | 'b') => () => {
    setFormData(prev => ({
      ...prev,
      [`option${option.toUpperCase()}Image`]: null,
    }));
    setUploadStatus(prev => ({
      ...prev,
      [`option${option.toUpperCase()}`]: { status: 'idle', progress: 0 },
    }));
  };

  const handleInputChange =
    (field: keyof PollFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));

      // Real-time validation
      const fieldError = validateField(field, value);
      setFieldErrors(prev => ({
        ...prev,
        [field]: fieldError || '',
      }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('You must be logged in to create a poll');
      return;
    }

    // Validate form
    const validation = validatePollForm(formData);
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      setError('Please fix the errors below');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      // Upload images first
      const [optionAResult, optionBResult] = await Promise.all([
        uploadPollImage(formData.optionAImage!, 'temp-id', 'a'),
        uploadPollImage(formData.optionBImage!, 'temp-id', 'b'),
      ]);

      if (
        !optionAResult.success ||
        !optionBResult.success ||
        !optionAResult.url ||
        !optionBResult.url
      ) {
        throw new Error('Failed to upload images');
      }

      // Create poll with privacy settings
      const pollData = await PollPrivacyService.createPollWithPrivacy(
        {
          creator_id: user.id,
          option_a_image_url: optionAResult.url,
          option_b_image_url: optionBResult.url,
          option_a_label: formData.optionALabel || null,
          option_b_label: formData.optionBLabel || null,
          description: formData.description || null,
          is_public: privacySettings.privacy_level === 'public',
        },
        privacySettings
      );

      if (!pollData) {
        throw new Error('Failed to create poll');
      }

      // Success callback or redirect
      if (onSuccess) {
        onSuccess(pollData.id);
      } else {
        router.push(`/poll/${pollData.id}`);
      }
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
          <Button onClick={() => router.push('/login')} className="mt-2">
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

      <Form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Uploads */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField>
            <FormLabel required>Option A</FormLabel>
            <ImageUpload
              option="a"
              onImageSelect={handleImageSelect('a')}
              onUploadComplete={handleImageUpload('a')}
              onError={handleImageError('a')}
              onRemove={handleImageRemove('a')}
              disabled={isSubmitting}
            />
            {fieldErrors.optionAImage && (
              <FormError>{fieldErrors.optionAImage}</FormError>
            )}
          </FormField>

          <FormField>
            <FormLabel required>Option B</FormLabel>
            <ImageUpload
              option="b"
              onImageSelect={handleImageSelect('b')}
              onUploadComplete={handleImageUpload('b')}
              onError={handleImageError('b')}
              onRemove={handleImageRemove('b')}
              disabled={isSubmitting}
            />
            {fieldErrors.optionBImage && (
              <FormError>{fieldErrors.optionBImage}</FormError>
            )}
          </FormField>
        </div>

        {/* Labels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField>
            <FormLabel htmlFor="optionALabel">
              Option A Label (optional)
            </FormLabel>
            <Input
              id="optionALabel"
              value={formData.optionALabel}
              onChange={handleInputChange('optionALabel')}
              placeholder="e.g., Pizza"
              disabled={isSubmitting}
              maxLength={50}
            />
            <FormDescription>
              {formData.optionALabel.length}/50 characters
            </FormDescription>
            {fieldErrors.optionALabel && (
              <FormError>{fieldErrors.optionALabel}</FormError>
            )}
          </FormField>

          <FormField>
            <FormLabel htmlFor="optionBLabel">
              Option B Label (optional)
            </FormLabel>
            <Input
              id="optionBLabel"
              value={formData.optionBLabel}
              onChange={handleInputChange('optionBLabel')}
              placeholder="e.g., Burger"
              disabled={isSubmitting}
              maxLength={50}
            />
            <FormDescription>
              {formData.optionBLabel.length}/50 characters
            </FormDescription>
            {fieldErrors.optionBLabel && (
              <FormError>{fieldErrors.optionBLabel}</FormError>
            )}
          </FormField>
        </div>

        {/* Description */}
        <FormField>
          <FormLabel htmlFor="description">Description (optional)</FormLabel>
          <Textarea
            id="description"
            value={formData.description}
            onChange={handleInputChange('description')}
            placeholder="What are you trying to decide?"
            rows={3}
            disabled={isSubmitting}
            maxLength={500}
          />
          <FormDescription>
            {formData.description.length}/500 characters
          </FormDescription>
          {fieldErrors.description && (
            <FormError>{fieldErrors.description}</FormError>
          )}
        </FormField>

        {/* Privacy Settings */}
        <PollPrivacySettings
          onPrivacyChange={setPrivacySettings}
          initialSettings={privacySettings}
          disabled={isSubmitting}
        />

        {/* Error Display */}
        {error && <Alert variant="destructive">{error}</Alert>}

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel || (() => router.back())}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              isSubmitting || !formData.optionAImage || !formData.optionBImage
            }
          >
            {isSubmitting ? 'Creating Poll...' : 'Create Poll'}
          </Button>
        </div>
      </Form>
    </div>
  );
}
