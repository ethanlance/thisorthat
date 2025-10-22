export interface PollFormData {
  optionAImage: File | null;
  optionBImage: File | null;
  optionALabel: string;
  optionBLabel: string;
  description: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export const validatePollForm = (data: PollFormData): ValidationResult => {
  const errors: Record<string, string> = {};

  // Required field validation
  if (!data.optionAImage) {
    errors.optionAImage = 'Option A image is required';
  }

  if (!data.optionBImage) {
    errors.optionBImage = 'Option B image is required';
  }

  // Label validation
  if (data.optionALabel && data.optionALabel.length > 50) {
    errors.optionALabel = 'Option A label must be 50 characters or less';
  }

  if (data.optionBLabel && data.optionBLabel.length > 50) {
    errors.optionBLabel = 'Option B label must be 50 characters or less';
  }

  // Description validation
  if (data.description && data.description.length > 500) {
    errors.description = 'Description must be 500 characters or less';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateField = (
  field: keyof PollFormData,
  value: any
): string | null => {
  switch (field) {
    case 'optionAImage':
      return value ? null : 'Option A image is required';
    case 'optionBImage':
      return value ? null : 'Option B image is required';
    case 'optionALabel':
      return value && value.length > 50
        ? 'Option A label must be 50 characters or less'
        : null;
    case 'optionBLabel':
      return value && value.length > 50
        ? 'Option B label must be 50 characters or less'
        : null;
    case 'description':
      return value && value.length > 500
        ? 'Description must be 500 characters or less'
        : null;
    default:
      return null;
  }
};
