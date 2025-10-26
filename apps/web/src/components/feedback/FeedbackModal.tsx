'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FeedbackForm } from './FeedbackForm';
import { Bug, Lightbulb, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeedbackModalProps {
  trigger?: React.ReactNode;
  initialType?: 'bug_report' | 'feature_request' | 'general_feedback';
  className?: string;
}

const feedbackTypes = {
  bug_report: {
    icon: Bug,
    label: 'Report a Bug',
    description: "Something isn't working",
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    hoverBgColor: 'hover:bg-red-100',
  },
  feature_request: {
    icon: Lightbulb,
    label: 'Request a Feature',
    description: 'Suggest an improvement',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    hoverBgColor: 'hover:bg-blue-100',
  },
  general_feedback: {
    icon: MessageSquare,
    label: 'General Feedback',
    description: 'Share your thoughts',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    hoverBgColor: 'hover:bg-green-100',
  },
};

export function FeedbackModal({
  trigger,
  initialType = 'general_feedback',
}: FeedbackModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(initialType);

  const handleSuccess = () => {
    setIsOpen(false);
  };

  const defaultTrigger = (
    <Button variant="outline" className="gap-2">
      <MessageSquare className="h-4 w-4" />
      Feedback
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Share Your Feedback
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Type Selection */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">
              What would you like to share?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.entries(feedbackTypes).map(([type, config]) => (
                <button
                  key={type}
                  onClick={() =>
                    setSelectedType(type as keyof typeof feedbackTypes)
                  }
                  className={cn(
                    'p-4 rounded-lg border text-left transition-colors',
                    'flex flex-col items-center gap-2',
                    selectedType === type
                      ? `${config.bgColor} border-current`
                      : 'hover:bg-muted/50',
                    config.hoverBgColor
                  )}
                >
                  <config.icon className={cn('h-6 w-6', config.color)} />
                  <div className="text-center">
                    <div className="font-medium text-sm">{config.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {config.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Form */}
          <FeedbackForm
            onSuccess={handleSuccess}
            onCancel={() => setIsOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Quick feedback buttons for common scenarios
export function QuickFeedbackButtons({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      <FeedbackModal
        trigger={
          <Button variant="outline" size="sm" className="gap-2">
            <Bug className="h-4 w-4" />
            Bug Report
          </Button>
        }
        initialType="bug_report"
      />
      <FeedbackModal
        trigger={
          <Button variant="outline" size="sm" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            Feature Request
          </Button>
        }
        initialType="feature_request"
      />
      <FeedbackModal
        trigger={
          <Button variant="outline" size="sm" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            General Feedback
          </Button>
        }
        initialType="general_feedback"
      />
    </div>
  );
}

// Floating feedback button
export function FloatingFeedbackButton({ className }: { className?: string }) {
  const [, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-4 right-4 z-40 rounded-full shadow-lg',
          'h-12 w-12 p-0',
          className
        )}
        size="icon"
      >
        <MessageSquare className="h-5 w-5" />
      </Button>

      <FeedbackModal trigger={null} initialType="general_feedback" />
    </>
  );
}
