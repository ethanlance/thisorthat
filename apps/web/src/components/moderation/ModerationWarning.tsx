'use client';

import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Eye, X, CheckCircle, Info } from 'lucide-react';
import { ContentDetectionResult } from '@/lib/services/content-detection';

interface ModerationWarningProps {
  result: ContentDetectionResult;
  onApprove?: () => void;
  onReject?: () => void;
  onDismiss?: () => void;
  showActions?: boolean;
  className?: string;
}

export default function ModerationWarning({
  result,
  onApprove,
  onReject,
  onDismiss,
  showActions = true,
  className,
}: ModerationWarningProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const getSeverityColor = (classification: string) => {
    switch (classification) {
      case 'inappropriate':
        return 'destructive';
      case 'questionable':
        return 'default';
      case 'spam':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getSeverityIcon = (classification: string) => {
    switch (classification) {
      case 'inappropriate':
        return <AlertTriangle className="h-4 w-4" />;
      case 'questionable':
        return <Eye className="h-4 w-4" />;
      case 'spam':
        return <Shield className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  if (isDismissed) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-sm">
            {getSeverityIcon(result.classification)}
            <span>Content Moderation Alert</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Classification Badge */}
          <div className="flex items-center space-x-2">
            <Badge variant={getSeverityColor(result.classification)}>
              {result.classification.toUpperCase()}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Confidence: {Math.round(result.confidence * 100)}%
            </span>
          </div>

          {/* Reason */}
          {result.reason && (
            <Alert variant={result.isApproved ? 'default' : 'destructive'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{result.reason}</AlertDescription>
            </Alert>
          )}

          {/* Detected Categories */}
          {result.detectedCategories &&
            result.detectedCategories.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Detected Categories:
                </p>
                <div className="flex flex-wrap gap-1">
                  {result.detectedCategories.map((category, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

          {/* Content Flags */}
          <div className="space-y-1">
            {result.adultContent && (
              <div className="flex items-center space-x-2 text-xs text-red-600">
                <AlertTriangle className="h-3 w-3" />
                <span>Adult content detected</span>
              </div>
            )}
            {result.violenceContent && (
              <div className="flex items-center space-x-2 text-xs text-red-600">
                <AlertTriangle className="h-3 w-3" />
                <span>Violent content detected</span>
              </div>
            )}
            {result.hateSpeech && (
              <div className="flex items-center space-x-2 text-xs text-red-600">
                <AlertTriangle className="h-3 w-3" />
                <span>Hate speech detected</span>
              </div>
            )}
          </div>

          {/* Human Review Notice */}
          {result.requiresHumanReview && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                This content requires human review before approval.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          {showActions && !result.isApproved && (
            <div className="flex space-x-2 pt-2">
              {onApprove && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onApprove}
                  className="flex items-center space-x-1"
                >
                  <CheckCircle className="h-3 w-3" />
                  <span>Approve</span>
                </Button>
              )}
              {onReject && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={onReject}
                  className="flex items-center space-x-1"
                >
                  <X className="h-3 w-3" />
                  <span>Reject</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
