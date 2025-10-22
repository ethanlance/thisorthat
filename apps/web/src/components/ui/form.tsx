import * as React from 'react';
import { cn } from '@/lib/utils';

interface FormProps extends React.ComponentProps<'form'> {
  children: React.ReactNode;
}

interface FormFieldProps {
  children: React.ReactNode;
  className?: string;
}

interface FormLabelProps extends React.ComponentProps<'label'> {
  children: React.ReactNode;
  required?: boolean;
}

interface FormErrorProps {
  children: React.ReactNode;
  className?: string;
}

interface FormDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

function Form({ children, className, ...props }: FormProps) {
  return (
    <form className={cn('space-y-4', className)} {...props}>
      {children}
    </form>
  );
}

function FormField({ children, className }: FormFieldProps) {
  return <div className={cn('space-y-2', className)}>{children}</div>;
}

function FormLabel({
  children,
  required,
  className,
  ...props
}: FormLabelProps) {
  return (
    <label
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-destructive ml-1">*</span>}
    </label>
  );
}

function FormError({ children, className }: FormErrorProps) {
  return (
    <p className={cn('text-sm text-destructive', className)}>{children}</p>
  );
}

function FormDescription({ children, className }: FormDescriptionProps) {
  return (
    <p className={cn('text-sm text-muted-foreground', className)}>{children}</p>
  );
}

export { Form, FormField, FormLabel, FormError, FormDescription };
