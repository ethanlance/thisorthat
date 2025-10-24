'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Flag,
  Send,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Shield,
} from 'lucide-react';

interface ReportContentProps {
  contentType: 'poll' | 'comment' | 'user' | 'image';
  contentId: string;
  onReportSubmitted?: () => void;
  className?: string;
}

const REPORT_CATEGORIES = [
  {
    value: 'inappropriate_content',
    label: 'Inappropriate Content',
    description: 'Content that violates community standards',
  },
  {
    value: 'spam',
    label: 'Spam',
    description: 'Repetitive or unwanted content',
  },
  {
    value: 'harassment',
    label: 'Harassment',
    description: 'Targeted abuse or bullying',
  },
  {
    value: 'violence',
    label: 'Violence',
    description: 'Content promoting or depicting violence',
  },
  {
    value: 'hate_speech',
    label: 'Hate Speech',
    description: 'Content targeting groups based on identity',
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Other violations not listed above',
  },
];

export default function ReportContent({
  contentType,
  contentId,
  onReportSubmitted,
  className,
}: ReportContentProps) {
  const [reportCategory, setReportCategory] = useState<string>('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reportCategory) {
      setError('Please select a report category');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/content/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content_type: contentType,
          content_id: contentId,
          report_category: reportCategory,
          description: description.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit report');
      }

      setIsSubmitted(true);
      onReportSubmitted?.();
    } catch (err) {
      console.error('Error submitting report:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">Report Submitted</h3>
              <p className="text-sm text-muted-foreground">
                Thank you for helping keep our community safe. Your report has
                been submitted and will be reviewed by our moderation team.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Flag className="h-5 w-5 text-red-500" />
          <span>Report Content</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Content Type Badge */}
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline" className="capitalize">
              {contentType}
            </Badge>
          </div>

          {/* Report Category */}
          <div className="space-y-2">
            <Label htmlFor="report-category">What&apos;s the issue? *</Label>
            <Select value={reportCategory} onValueChange={setReportCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_CATEGORIES.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    <div className="flex flex-col">
                      <span>{category.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {category.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Additional Details (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Please provide any additional context that might help our moderation team understand the issue..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/500 characters
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-2">
            <Button
              type="submit"
              disabled={isSubmitting || !reportCategory}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Report
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
