'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  FormField,
  FormLabel,
  FormError,
  FormDescription,
} from '@/components/ui/form';
import ImageUpload from '@/components/upload/ImageUpload';
import { PollFormData } from '@/lib/validation/poll-validation';

interface PollFormFieldsProps {
  formData: PollFormData;
  fieldErrors: Record<string, string>;
  uploadStatus: {
    optionA: {
      status: 'idle' | 'uploading' | 'success' | 'error';
      progress: number;
    };
    optionB: {
      status: 'idle' | 'uploading' | 'success' | 'error';
      progress: number;
    };
  };
  isSubmitting: boolean;
  onImageSelect: (option: 'a' | 'b') => (file: File) => void;
  onImageUpload: (option: 'a' | 'b') => (url: string) => void;
  onImageError: (option: 'a' | 'b') => (error: string) => void;
  onImageRemove: (option: 'a' | 'b') => () => void;
  onInputChange: (
    field: keyof PollFormData
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export default function PollFormFields({
  formData,
  fieldErrors,
  uploadStatus,
  isSubmitting,
  onImageSelect,
  onImageUpload,
  onImageError,
  onImageRemove,
  onInputChange,
}: PollFormFieldsProps) {
  // uploadStatus is available but not used in this component
  void uploadStatus;
  return (
    <>
      {/* Image Uploads */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField>
          <FormLabel required>Option A</FormLabel>
          <ImageUpload
            option="a"
            onImageSelect={onImageSelect('a')}
            onUploadComplete={onImageUpload('a')}
            onError={onImageError('a')}
            onRemove={onImageRemove('a')}
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
            onImageSelect={onImageSelect('b')}
            onUploadComplete={onImageUpload('b')}
            onError={onImageError('b')}
            onRemove={onImageRemove('b')}
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
            onChange={onInputChange('optionALabel')}
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
            onChange={onInputChange('optionBLabel')}
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
          onChange={onInputChange('description')}
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
    </>
  );
}
