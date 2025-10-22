import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  Form,
  FormField,
  FormLabel,
  FormError,
  FormDescription,
} from '@/components/ui/form';

describe('Form Components', () => {
  describe('Form', () => {
    it('renders form with children', () => {
      render(
        <Form>
          <div>Form Content</div>
        </Form>
      );
      expect(screen.getByText('Form Content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Form className="custom-form">
          <div>Form Content</div>
        </Form>
      );
      const form = screen.getByText('Form Content').closest('form');
      expect(form).toHaveClass('custom-form');
    });

    it('forwards additional props', () => {
      render(
        <Form data-testid="test-form">
          <div>Form Content</div>
        </Form>
      );
      expect(screen.getByTestId('test-form')).toBeInTheDocument();
    });
  });

  describe('FormField', () => {
    it('renders field with children', () => {
      render(
        <FormField>
          <div>Field Content</div>
        </FormField>
      );
      expect(screen.getByText('Field Content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <FormField className="custom-field">
          <div>Field Content</div>
        </FormField>
      );
      const field = screen.getByText('Field Content').parentElement;
      expect(field).toHaveClass('custom-field');
    });
  });

  describe('FormLabel', () => {
    it('renders label with children', () => {
      render(<FormLabel>Test Label</FormLabel>);
      expect(screen.getByText('Test Label')).toBeInTheDocument();
    });

    it('shows required indicator when required prop is true', () => {
      render(<FormLabel required>Required Label</FormLabel>);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('does not show required indicator when required prop is false', () => {
      render(<FormLabel required={false}>Optional Label</FormLabel>);
      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<FormLabel className="custom-label">Test Label</FormLabel>);
      const label = screen.getByText('Test Label');
      expect(label).toHaveClass('custom-label');
    });
  });

  describe('FormError', () => {
    it('renders error message', () => {
      render(<FormError>Error message</FormError>);
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<FormError className="custom-error">Error message</FormError>);
      const error = screen.getByText('Error message');
      expect(error).toHaveClass('custom-error');
    });
  });

  describe('FormDescription', () => {
    it('renders description text', () => {
      render(<FormDescription>Description text</FormDescription>);
      expect(screen.getByText('Description text')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <FormDescription className="custom-description">
          Description text
        </FormDescription>
      );
      const description = screen.getByText('Description text');
      expect(description).toHaveClass('custom-description');
    });
  });
});
