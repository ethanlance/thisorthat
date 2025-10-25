'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorHandlingService } from '@/lib/services/error-handling';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Send,
  CheckCircle,
  AlertCircle,
  Bug,
  Lightbulb,
  MessageSquare,
  Upload,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type FeedbackType =
  | 'bug_report'
  | 'feature_request'
  | 'general_feedback';
export type FeedbackPriority = 'low' | 'medium' | 'high' | 'urgent';

interface FeedbackFormProps {
  initialType?: FeedbackType;
  initialSubject?: string;
  initialDescription?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
  compact?: boolean;
}

const feedbackTypeConfig = {
  bug_report: {
    icon: Bug,
    label: 'Bug Report',
    description: "Something isn't working as expected",
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  feature_request: {
    icon: Lightbulb,
    label: 'Feature Request',
    description: 'Suggest a new feature or improvement',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  general_feedback: {
    icon: MessageSquare,
    label: 'General Feedback',
    description: 'Share your thoughts or suggestions',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
};

const priorityConfig = {
  low: { label: 'Low', color: 'text-gray-600' },
  medium: { label: 'Medium', color: 'text-yellow-600' },
  high: { label: 'High', color: 'text-orange-600' },
  critical: { label: 'Critical', color: 'text-red-600' },
};

export function FeedbackForm({
  initialType = 'general_feedback',
  initialSubject = '',
  initialDescription = '',
  onSuccess,
  onCancel,
  className,
  compact = false,
}: FeedbackFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    type: initialType,
    subject: initialSubject,
    description: initialDescription,
    priority: 'medium' as FeedbackPriority,
    includeSystemInfo: true,
    includeUserAgent: true,
    includeUrl: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSubmitStatus('idle');
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subject.trim() || !formData.description.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const metadata: Record<string, unknown> = {};

      if (formData.includeSystemInfo) {
        metadata.browser = navigator.userAgent;
        metadata.screen = {
          width: window.screen.width,
          height: window.screen.height,
        };
        metadata.viewport = {
          width: window.innerWidth,
          height: window.innerHeight,
        };
      }

      if (formData.includeUrl) {
        metadata.url = window.location.href;
        metadata.pathname = window.location.pathname;
      }

      const success = await ErrorHandlingService.submitFeedback({
        feedback_type: formData.type,
        title: formData.subject.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        status: 'open',
        additional_data: metadata,
        user_id: user?.id,
      });

      if (success) {
        setSubmitStatus('success');
        if (onSuccess) {
          setTimeout(onSuccess, 1500);
        }
      } else {
        setSubmitStatus('error');
        setErrorMessage('Failed to submit feedback. Please try again.');
      }
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage('An unexpected error occurred. Please try again.');
      console.error('Feedback submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentTypeConfig = feedbackTypeConfig[formData.type];

  if (submitStatus === 'success') {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                Thank you for your feedback!
              </h3>
              <p className="text-muted-foreground">
                We&apos;ve received your{' '}
                {feedbackTypeConfig[formData.type].label.toLowerCase()} and will
                review it soon.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <currentTypeConfig.icon
            className={cn('h-5 w-5', currentTypeConfig.color)}
          />
          {compact ? 'Feedback' : 'Share Your Feedback'}
        </CardTitle>
        {!compact && (
          <p className="text-sm text-muted-foreground">
            {currentTypeConfig.description}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Feedback Type Selection */}
          {!compact && (
            <div className="space-y-3">
              <Label>What type of feedback is this?</Label>
              <RadioGroup
                value={formData.type}
                onValueChange={value => handleInputChange('type', value)}
                className="grid grid-cols-1 gap-3"
              >
                {Object.entries(feedbackTypeConfig).map(([type, config]) => (
                  <div key={type} className="flex items-center space-x-3">
                    <RadioGroupItem value={type} id={type} />
                    <Label
                      htmlFor={type}
                      className={cn(
                        'flex items-center gap-2 cursor-pointer flex-1 p-3 rounded-lg border',
                        formData.type === type
                          ? config.bgColor
                          : 'hover:bg-muted/50'
                      )}
                    >
                      <config.icon className={cn('h-4 w-4', config.color)} />
                      <div>
                        <div className="font-medium">{config.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {config.description}
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">
              Subject <span className="text-destructive">*</span>
            </Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={e => handleInputChange('subject', e.target.value)}
              placeholder="Brief description of your feedback"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => handleInputChange('description', e.target.value)}
              placeholder="Please provide as much detail as possible..."
              rows={compact ? 4 : 6}
              required
            />
          </div>

          {/* Priority (only for bug reports) */}
          {formData.type === 'bug_report' && (
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={value => handleInputChange('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(priorityConfig).map(([priority, config]) => (
                    <SelectItem key={priority} value={priority}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={config.color}>
                          {config.label}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* System Information Options */}
          {!compact && (
            <div className="space-y-3">
              <Label>Include additional information to help us debug?</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeSystemInfo"
                    checked={formData.includeSystemInfo}
                    onCheckedChange={checked =>
                      handleInputChange('includeSystemInfo', checked as boolean)
                    }
                  />
                  <Label htmlFor="includeSystemInfo" className="text-sm">
                    Browser and system information
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeUrl"
                    checked={formData.includeUrl}
                    onCheckedChange={checked =>
                      handleInputChange('includeUrl', checked as boolean)
                    }
                  />
                  <Label htmlFor="includeUrl" className="text-sm">
                    Current page URL
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {submitStatus === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !formData.subject.trim() ||
                !formData.description.trim()
              }
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Feedback
                </>
              )}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Compact feedback button for quick access
export function FeedbackButton({
  type = 'general_feedback',
  className,
}: {
  type?: FeedbackType;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (isOpen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
        <div className="w-full max-w-2xl">
          <FeedbackForm
            initialType={type}
            onSuccess={() => setIsOpen(false)}
            onCancel={() => setIsOpen(false)}
            compact
          />
        </div>
      </div>
    );
  }

  const typeConfig = feedbackTypeConfig[type];

  return (
    <Button onClick={() => setIsOpen(true)} className={cn('gap-2', className)}>
      <typeConfig.icon className="h-4 w-4" />
      {typeConfig.label}
    </Button>
  );
}
