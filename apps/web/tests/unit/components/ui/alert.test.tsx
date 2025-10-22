import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

describe('Alert Components', () => {
  describe('Alert', () => {
    it('renders with default variant', () => {
      render(<Alert>Default alert</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveClass('bg-background', 'text-foreground');
    });

    it('renders with destructive variant', () => {
      render(<Alert variant="destructive">Destructive alert</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('border-destructive/50', 'text-destructive');
    });

    it('renders with success variant', () => {
      render(<Alert variant="success">Success alert</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('border-green-500/50', 'text-green-700');
    });

    it('renders with warning variant', () => {
      render(<Alert variant="warning">Warning alert</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('border-yellow-500/50', 'text-yellow-700');
    });

    it('applies custom className', () => {
      render(<Alert className="custom-alert">Test alert</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('custom-alert');
    });
  });

  describe('AlertTitle', () => {
    it('renders title text', () => {
      render(
        <Alert>
          <AlertTitle>Alert Title</AlertTitle>
        </Alert>
      );
      expect(screen.getByText('Alert Title')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Alert>
          <AlertTitle className="custom-title">Alert Title</AlertTitle>
        </Alert>
      );
      const title = screen.getByText('Alert Title');
      expect(title).toHaveClass('custom-title');
    });
  });

  describe('AlertDescription', () => {
    it('renders description text', () => {
      render(
        <Alert>
          <AlertDescription>Alert description</AlertDescription>
        </Alert>
      );
      expect(screen.getByText('Alert description')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Alert>
          <AlertDescription className="custom-description">
            Alert description
          </AlertDescription>
        </Alert>
      );
      const description = screen.getByText('Alert description');
      expect(description).toHaveClass('custom-description');
    });
  });

  describe('Complete Alert', () => {
    it('renders complete alert with title and description', () => {
      render(
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Something went wrong</AlertDescription>
        </Alert>
      );

      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });
});
