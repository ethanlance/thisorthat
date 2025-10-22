import { describe, it, expect } from 'vitest';
import {
  validatePollForm,
  validateField,
  PollFormData,
} from '@/lib/validation/poll-validation';

describe('poll-validation', () => {
  const createMockFile = (
    name: string = 'test.jpg',
    size: number = 1024
  ): File => {
    const file = new File(['test content'], name, { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: size });
    return file;
  };

  const createValidFormData = (): PollFormData => ({
    optionAImage: createMockFile(),
    optionBImage: createMockFile(),
    optionALabel: 'Pizza',
    optionBLabel: 'Burger',
    description: 'What should I have for dinner?',
  });

  describe('validatePollForm', () => {
    it('should validate a complete form successfully', () => {
      const formData = createValidFormData();
      const result = validatePollForm(formData);

      expect(result.valid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should require option A image', () => {
      const formData = createValidFormData();
      formData.optionAImage = null;

      const result = validatePollForm(formData);

      expect(result.valid).toBe(false);
      expect(result.errors.optionAImage).toBe('Option A image is required');
    });

    it('should require option B image', () => {
      const formData = createValidFormData();
      formData.optionBImage = null;

      const result = validatePollForm(formData);

      expect(result.valid).toBe(false);
      expect(result.errors.optionBImage).toBe('Option B image is required');
    });

    it('should validate option A label length', () => {
      const formData = createValidFormData();
      formData.optionALabel = 'A'.repeat(51);

      const result = validatePollForm(formData);

      expect(result.valid).toBe(false);
      expect(result.errors.optionALabel).toBe(
        'Option A label must be 50 characters or less'
      );
    });

    it('should validate option B label length', () => {
      const formData = createValidFormData();
      formData.optionBLabel = 'B'.repeat(51);

      const result = validatePollForm(formData);

      expect(result.valid).toBe(false);
      expect(result.errors.optionBLabel).toBe(
        'Option B label must be 50 characters or less'
      );
    });

    it('should validate description length', () => {
      const formData = createValidFormData();
      formData.description = 'D'.repeat(501);

      const result = validatePollForm(formData);

      expect(result.valid).toBe(false);
      expect(result.errors.description).toBe(
        'Description must be 500 characters or less'
      );
    });

    it('should allow empty optional fields', () => {
      const formData = createValidFormData();
      formData.optionALabel = '';
      formData.optionBLabel = '';
      formData.description = '';

      const result = validatePollForm(formData);

      expect(result.valid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should validate multiple errors at once', () => {
      const formData = createValidFormData();
      formData.optionAImage = null;
      formData.optionBImage = null;
      formData.optionALabel = 'A'.repeat(51);
      formData.optionBLabel = 'B'.repeat(51);
      formData.description = 'D'.repeat(501);

      const result = validatePollForm(formData);

      expect(result.valid).toBe(false);
      expect(result.errors.optionAImage).toBe('Option A image is required');
      expect(result.errors.optionBImage).toBe('Option B image is required');
      expect(result.errors.optionALabel).toBe(
        'Option A label must be 50 characters or less'
      );
      expect(result.errors.optionBLabel).toBe(
        'Option B label must be 50 characters or less'
      );
      expect(result.errors.description).toBe(
        'Description must be 500 characters or less'
      );
    });
  });

  describe('validateField', () => {
    it('should validate optionAImage field', () => {
      expect(validateField('optionAImage', null)).toBe(
        'Option A image is required'
      );
      expect(validateField('optionAImage', createMockFile())).toBe(null);
    });

    it('should validate optionBImage field', () => {
      expect(validateField('optionBImage', null)).toBe(
        'Option B image is required'
      );
      expect(validateField('optionBImage', createMockFile())).toBe(null);
    });

    it('should validate optionALabel field', () => {
      expect(validateField('optionALabel', '')).toBe(null);
      expect(validateField('optionALabel', 'Valid label')).toBe(null);
      expect(validateField('optionALabel', 'A'.repeat(51))).toBe(
        'Option A label must be 50 characters or less'
      );
    });

    it('should validate optionBLabel field', () => {
      expect(validateField('optionBLabel', '')).toBe(null);
      expect(validateField('optionBLabel', 'Valid label')).toBe(null);
      expect(validateField('optionBLabel', 'B'.repeat(51))).toBe(
        'Option B label must be 50 characters or less'
      );
    });

    it('should validate description field', () => {
      expect(validateField('description', '')).toBe(null);
      expect(validateField('description', 'Valid description')).toBe(null);
      expect(validateField('description', 'D'.repeat(501))).toBe(
        'Description must be 500 characters or less'
      );
    });

    it('should return null for unknown fields', () => {
      expect(
        validateField(
          'unknownField' as unknown as Parameters<typeof validateField>[0],
          'any value'
        )
      ).toBe(null);
    });
  });
});
