import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ModerationWarning from '@/components/moderation/ModerationWarning';
import { ContentDetectionResult } from '@/lib/services/content-detection';

describe('ModerationWarning', () => {
  it('should render inappropriate content warning', () => {
    const mockResult: ContentDetectionResult = {
      isApproved: false,
      classification: 'inappropriate',
      confidence: 0.9,
      reason: 'Contains inappropriate content',
      requiresHumanReview: true,
      adultContent: true,
      violenceContent: false,
      hateSpeech: false,
    };

    render(
      <ModerationWarning
        result={mockResult}
        onApprove={() => {}}
        onReject={() => {}}
      />
    );

    expect(screen.getByText('Content Moderation Alert')).toBeInTheDocument();
    expect(screen.getByText('INAPPROPRIATE')).toBeInTheDocument();
    expect(screen.getByText('Contains inappropriate content')).toBeInTheDocument();
    expect(screen.getByText('Adult content detected')).toBeInTheDocument();
  });

  it('should render spam content warning', () => {
    const mockResult: ContentDetectionResult = {
      isApproved: false,
      classification: 'spam',
      confidence: 0.8,
      reason: 'Contains spam keywords',
      requiresHumanReview: false,
    };

    render(
      <ModerationWarning
        result={mockResult}
        onApprove={() => {}}
        onReject={() => {}}
      />
    );

    expect(screen.getByText('SPAM')).toBeInTheDocument();
    expect(screen.getByText('Contains spam keywords')).toBeInTheDocument();
  });

  it('should render questionable content warning', () => {
    const mockResult: ContentDetectionResult = {
      isApproved: false,
      classification: 'questionable',
      confidence: 0.7,
      reason: 'Contains potentially inappropriate content',
      requiresHumanReview: true,
    };

    render(
      <ModerationWarning
        result={mockResult}
        onApprove={() => {}}
        onReject={() => {}}
      />
    );

    expect(screen.getByText('QUESTIONABLE')).toBeInTheDocument();
    expect(screen.getByText('Contains potentially inappropriate content')).toBeInTheDocument();
    expect(screen.getByText('This content requires human review before approval')).toBeInTheDocument();
  });

  it('should handle approve action', () => {
    const mockResult: ContentDetectionResult = {
      isApproved: false,
      classification: 'questionable',
      confidence: 0.7,
      requiresHumanReview: true,
    };

    const onApprove = vi.fn();

    render(
      <ModerationWarning
        result={mockResult}
        onApprove={onApprove}
        onReject={() => {}}
      />
    );

    const approveButton = screen.getByText('Approve');
    fireEvent.click(approveButton);

    expect(onApprove).toHaveBeenCalled();
  });

  it('should handle reject action', () => {
    const mockResult: ContentDetectionResult = {
      isApproved: false,
      classification: 'inappropriate',
      confidence: 0.9,
      reason: 'Contains inappropriate content',
      requiresHumanReview: false,
    };

    const onReject = vi.fn();

    render(
      <ModerationWarning
        result={mockResult}
        onApprove={() => {}}
        onReject={onReject}
      />
    );

    const rejectButton = screen.getByText('Reject');
    fireEvent.click(rejectButton);

    expect(onReject).toHaveBeenCalled();
  });

  it('should handle dismiss action', () => {
    const mockResult: ContentDetectionResult = {
      isApproved: false,
      classification: 'questionable',
      confidence: 0.7,
      requiresHumanReview: true,
    };

    const onDismiss = vi.fn();

    render(
      <ModerationWarning
        result={mockResult}
        onApprove={() => {}}
        onReject={() => {}}
        onDismiss={onDismiss}
      />
    );

    const dismissButton = screen.getByRole('button', { name: /remove/i });
    fireEvent.click(dismissButton);

    expect(onDismiss).toHaveBeenCalled();
  });

  it('should show detected categories', () => {
    const mockResult: ContentDetectionResult = {
      isApproved: false,
      classification: 'inappropriate',
      confidence: 0.9,
      reason: 'Contains inappropriate content',
      requiresHumanReview: true,
      detectedCategories: ['adult', 'violence', 'hate'],
    };

    render(
      <ModerationWarning
        result={mockResult}
        onApprove={() => {}}
        onReject={() => {}}
      />
    );

    expect(screen.getByText('Detected Categories:')).toBeInTheDocument();
    expect(screen.getByText('adult')).toBeInTheDocument();
    expect(screen.getByText('violence')).toBeInTheDocument();
    expect(screen.getByText('hate')).toBeInTheDocument();
  });

  it('should show content flags', () => {
    const mockResult: ContentDetectionResult = {
      isApproved: false,
      classification: 'inappropriate',
      confidence: 0.9,
      reason: 'Contains inappropriate content',
      requiresHumanReview: true,
      adultContent: true,
      violenceContent: true,
      hateSpeech: true,
    };

    render(
      <ModerationWarning
        result={mockResult}
        onApprove={() => {}}
        onReject={() => {}}
      />
    );

    expect(screen.getByText('Adult content detected')).toBeInTheDocument();
    expect(screen.getByText('Violent content detected')).toBeInTheDocument();
    expect(screen.getByText('Hate speech detected')).toBeInTheDocument();
  });

  it('should not show action buttons when showActions is false', () => {
    const mockResult: ContentDetectionResult = {
      isApproved: false,
      classification: 'inappropriate',
      confidence: 0.9,
      reason: 'Contains inappropriate content',
      requiresHumanReview: true,
    };

    render(
      <ModerationWarning
        result={mockResult}
        onApprove={() => {}}
        onReject={() => {}}
        showActions={false}
      />
    );

    expect(screen.queryByText('Approve')).not.toBeInTheDocument();
    expect(screen.queryByText('Reject')).not.toBeInTheDocument();
  });

  it('should not show action buttons for approved content', () => {
    const mockResult: ContentDetectionResult = {
      isApproved: true,
      classification: 'safe',
      confidence: 0.9,
      requiresHumanReview: false,
    };

    render(
      <ModerationWarning
        result={mockResult}
        onApprove={() => {}}
        onReject={() => {}}
      />
    );

    expect(screen.queryByText('Approve')).not.toBeInTheDocument();
    expect(screen.queryByText('Reject')).not.toBeInTheDocument();
  });

  it('should display confidence percentage', () => {
    const mockResult: ContentDetectionResult = {
      isApproved: false,
      classification: 'inappropriate',
      confidence: 0.85,
      reason: 'Contains inappropriate content',
      requiresHumanReview: true,
    };

    render(
      <ModerationWarning
        result={mockResult}
        onApprove={() => {}}
        onReject={() => {}}
      />
    );

    expect(screen.getByText('Confidence: 85%')).toBeInTheDocument();
  });
});
