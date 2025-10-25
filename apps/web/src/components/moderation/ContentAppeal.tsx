'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileText,
  Send,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Shield,
} from 'lucide-react';

interface ContentAppealProps {
  moderationActionId: string;
  contentType: 'poll' | 'comment' | 'user' | 'image';
  contentId: string;
  onAppealSubmitted?: () => void;
  className?: string;
}

export default function ContentAppeal({
  moderationActionId,
  contentType,
  contentId,
  onAppealSubmitted,
  className,
}: ContentAppealProps) {
  const [appealReason, setAppealReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!appealReason.trim()) {
      setError('Please provide a reason for your appeal');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/content/appeal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moderation_action_id: moderationActionId,
          appeal_reason: appealReason.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit appeal');
      }

      setIsSubmitted(true);
      onAppealSubmitted?.();
    } catch (err) {
      console.error('Error submitting appeal:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit appeal');
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
              <h3 className="text-lg font-semibold">Appeal Submitted</h3>
              <p className="text-sm text-muted-foreground">
                Your appeal has been submitted and will be reviewed by our
                moderation team. You will be notified of the decision.
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
          <Shield className="h-5 w-5 text-primary" />
          <span>Appeal Moderation Decision</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Content Info */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium capitalize">
                {contentType} Content
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Content ID: {contentId}
            </p>
          </div>

          {/* Appeal Reason */}
          <div className="space-y-2">
            <Label htmlFor="appeal-reason">
              Why do you believe this decision was incorrect? *
            </Label>
            <Textarea
              id="appeal-reason"
              placeholder="Please explain why you believe the moderation decision was incorrect. Provide any relevant context or evidence that might help our team understand your perspective..."
              value={appealReason}
              onChange={e => setAppealReason(e.target.value)}
              rows={4}
              maxLength={1000}
              required
            />
            <p className="text-xs text-muted-foreground">
              {appealReason.length}/1000 characters
            </p>
          </div>

          {/* Guidelines */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Appeal Guidelines:</p>
                <ul className="text-xs space-y-1 list-disc list-inside">
                  <li>Be respectful and constructive in your appeal</li>
                  <li>
                    Provide specific reasons why you believe the decision was
                    incorrect
                  </li>
                  <li>Include any relevant context or evidence</li>
                  <li>Appeals are reviewed by human moderators</li>
                  <li>You will be notified of the decision via email</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || !appealReason.trim()}
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
                  Submit Appeal
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
