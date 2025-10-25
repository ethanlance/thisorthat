import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ModerationService } from '@/lib/services/moderation';
import { ContentDetectionService } from '@/lib/services/content-detection';
import ModerationDashboard from '@/components/moderation/ModerationDashboard';
import ReportContent from '@/components/moderation/ReportContent';
import ContentGuidelines from '@/components/moderation/ContentGuidelines';
import ModerationWarning from '@/components/moderation/ModerationWarning';
import ContentAppeal from '@/components/moderation/ContentAppeal';
import ModerationStats from '@/components/moderation/ModerationStats';

// Mock fetch
global.fetch = vi.fn();

describe('Content Moderation System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ModerationService', () => {
    it('should submit a content report', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            error: null,
          }),
        }),
      };

      vi.spyOn(ModerationService, 'submitReport').mockResolvedValue(true);

      const result = await ModerationService.submitReport(
        'user-123',
        'poll',
        'poll-456',
        'inappropriate_content',
        'This poll contains inappropriate content'
      );

      expect(result).toBe(true);
    });

    it('should get moderation queue', async () => {
      const mockQueue = [
        {
          report_id: 'report-1',
          content_type: 'poll',
          content_id: 'poll-123',
          report_category: 'inappropriate_content',
          description: 'Inappropriate content',
          reporter_email: 'user@example.com',
          created_at: '2024-01-01T00:00:00Z',
          status: 'pending',
        },
      ];

      vi.spyOn(ModerationService, 'getModerationQueue').mockResolvedValue(mockQueue);

      const result = await ModerationService.getModerationQueue(10, 0);

      expect(result).toEqual(mockQueue);
    });

    it('should take moderation action', async () => {
      vi.spyOn(ModerationService, 'takeModerationAction').mockResolvedValue(true);

      const result = await ModerationService.takeModerationAction(
        'moderator-123',
        'poll',
        'poll-456',
        'delete',
        'Inappropriate content',
        'high'
      );

      expect(result).toBe(true);
    });

    it('should classify content', async () => {
      const mockResult = {
        isApproved: false,
        classification: 'inappropriate' as const,
        confidence: 0.9,
        reason: 'Contains inappropriate content',
        requiresHumanReview: true,
      };

      vi.spyOn(ModerationService, 'classifyContent').mockResolvedValue(mockResult);

      const result = await ModerationService.classifyContent(
        'comment',
        'comment-123',
        'This is inappropriate content'
      );

      expect(result).toEqual(mockResult);
    });
  });

  describe('ContentDetectionService', () => {
    it('should detect inappropriate text content', async () => {
      const result = await ContentDetectionService.detectTextContent(
        'This is spam content with buy now',
        'comment'
      );

      expect(result.isApproved).toBe(false);
      expect(result.classification).toBe('spam');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should detect safe text content', async () => {
      const result = await ContentDetectionService.detectTextContent(
        'This is a normal comment about pizza',
        'comment'
      );

      expect(result.isApproved).toBe(true);
      expect(result.classification).toBe('safe');
    });

    it('should detect hate speech', async () => {
      const result = await ContentDetectionService.detectTextContent(
        'This contains racist content',
        'comment'
      );

      expect(result.isApproved).toBe(false);
      expect(result.classification).toBe('inappropriate');
      expect(result.requiresHumanReview).toBe(true);
    });

    it('should scan content during upload', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      const result = await ContentDetectionService.scanContent(
        'image',
        'image-123',
        mockFile
      );

      expect(result).toBeDefined();
      expect(result.isApproved).toBeDefined();
      expect(result.classification).toBeDefined();
    });
  });

  describe('ModerationDashboard', () => {
    it('should render moderation dashboard', async () => {
      const mockQueue = [
        {
          report_id: 'report-1',
          content_type: 'poll',
          content_id: 'poll-123',
          report_category: 'inappropriate_content',
          description: 'Inappropriate content',
          reporter_email: 'user@example.com',
          created_at: '2024-01-01T00:00:00Z',
          status: 'pending',
        },
      ];

      const mockStats = {
        total_reports: 10,
        pending_reports: 5,
        resolved_reports: 3,
        total_actions: 8,
        appeals_pending: 2,
      };

      (fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/moderation/queue')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ queue: mockQueue }),
          });
        }
        if (url.includes('/api/moderation/stats')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockStats),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<ModerationDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Moderation Dashboard')).toBeInTheDocument();
      });

      expect(screen.getByText('Total Reports')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('should handle moderation actions', async () => {
      const mockQueue = [
        {
          report_id: 'report-1',
          content_type: 'poll',
          content_id: 'poll-123',
          report_category: 'inappropriate_content',
          description: 'Inappropriate content',
          reporter_email: 'user@example.com',
          created_at: '2024-01-01T00:00:00Z',
          status: 'pending',
        },
      ];

      (fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/moderation/queue')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ queue: mockQueue }),
          });
        }
        if (url.includes('/api/moderation/action')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<ModerationDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Moderation Dashboard')).toBeInTheDocument();
      });

      // Click on a report item
      const reportItem = screen.getByText('Inappropriate content');
      fireEvent.click(reportItem);

      // Select an action
      const actionSelect = screen.getByRole('combobox');
      fireEvent.click(actionSelect);

      // Submit the action
      const submitButton = screen.getByText('Take Action');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/moderation/action', expect.any(Object));
      });
    });
  });

  describe('ReportContent', () => {
    it('should render report form', () => {
      render(
        <ReportContent
          contentType="poll"
          contentId="poll-123"
          onReportSubmitted={() => {}}
        />
      );

      expect(screen.getByText('Report Content')).toBeInTheDocument();
      expect(screen.getByText('What\'s the issue? *')).toBeInTheDocument();
    });

    it('should submit a report', async () => {
      (fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      render(
        <ReportContent
          contentType="poll"
          contentId="poll-123"
          onReportSubmitted={() => {}}
        />
      );

      // Select a category
      const categorySelect = screen.getByRole('combobox');
      fireEvent.click(categorySelect);

      // Fill in description
      const descriptionInput = screen.getByPlaceholderText(/additional context/i);
      fireEvent.change(descriptionInput, { target: { value: 'This is inappropriate' } });

      // Submit the form
      const submitButton = screen.getByText('Submit Report');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/content/report', expect.any(Object));
      });
    });
  });

  describe('ContentGuidelines', () => {
    it('should render content guidelines', async () => {
      (fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          guidelines: 'Test guidelines',
          examples: {
            appropriate: ['Good example'],
            inappropriate: ['Bad example'],
          },
          consequences: 'Test consequences',
        }),
      });

      render(<ContentGuidelines />);

      await waitFor(() => {
        expect(screen.getByText('Community Guidelines')).toBeInTheDocument();
      });
    });
  });

  describe('ModerationWarning', () => {
    it('should render moderation warning', () => {
      const mockResult = {
        isApproved: false,
        classification: 'inappropriate' as const,
        confidence: 0.9,
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

      expect(screen.getByText('Content Moderation Alert')).toBeInTheDocument();
      expect(screen.getByText('INAPPROPRIATE')).toBeInTheDocument();
      expect(screen.getByText('Contains inappropriate content')).toBeInTheDocument();
    });

    it('should handle approve action', () => {
      const mockResult = {
        isApproved: false,
        classification: 'questionable' as const,
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
  });

  describe('ContentAppeal', () => {
    it('should render appeal form', () => {
      render(
        <ContentAppeal
          moderationActionId="action-123"
          contentType="poll"
          contentId="poll-123"
        />
      );

      expect(screen.getByText('Appeal Moderation Decision')).toBeInTheDocument();
      expect(screen.getByText('Why do you believe this decision was incorrect? *')).toBeInTheDocument();
    });

    it('should submit an appeal', async () => {
      (fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      render(
        <ContentAppeal
          moderationActionId="action-123"
          contentType="poll"
          contentId="poll-123"
        />
      );

      // Fill in appeal reason
      const reasonInput = screen.getByPlaceholderText(/explain why/i);
      fireEvent.change(reasonInput, { target: { value: 'This was a mistake' } });

      // Submit the appeal
      const submitButton = screen.getByText('Submit Appeal');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/content/appeal', expect.any(Object));
      });
    });
  });

  describe('ModerationStats', () => {
    it('should render moderation statistics', async () => {
      const mockModerationStats = {
        total_reports: 10,
        pending_reports: 5,
        resolved_reports: 3,
        total_actions: 8,
        appeals_pending: 2,
      };

      const mockDetectionStats = {
        totalScans: 100,
        safeContent: 80,
        inappropriateContent: 15,
        spamContent: 5,
        humanReviewRequired: 10,
      };

      (fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/moderation/stats')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockModerationStats),
          });
        }
        if (url.includes('/api/moderation/detection-stats')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockDetectionStats),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<ModerationStats />);

      await waitFor(() => {
        expect(screen.getByText('Moderation Statistics')).toBeInTheDocument();
      });

      expect(screen.getByText('Total Reports')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete moderation workflow', async () => {
      // 1. User reports content
      const reportResult = await ModerationService.submitReport(
        'user-123',
        'poll',
        'poll-456',
        'inappropriate_content',
        'This poll contains inappropriate content'
      );

      expect(reportResult).toBe(true);

      // 2. Moderator reviews and takes action
      const actionResult = await ModerationService.takeModerationAction(
        'moderator-123',
        'poll',
        'poll-456',
        'delete',
        'Inappropriate content confirmed',
        'high'
      );

      expect(actionResult).toBe(true);

      // 3. User appeals the decision
      const appealResult = await ModerationService.submitAppeal(
        'user-123',
        'action-123',
        'This was a mistake, the content was appropriate'
      );

      expect(appealResult).toBe(true);
    });

    it('should handle content detection workflow', async () => {
      // 1. Content is uploaded and scanned
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const detectionResult = await ContentDetectionService.scanContent(
        'image',
        'image-123',
        mockFile
      );

      expect(detectionResult).toBeDefined();
      expect(detectionResult.isApproved).toBeDefined();

      // 2. If content is flagged, it requires human review
      if (!detectionResult.isApproved) {
        expect(detectionResult.requiresHumanReview).toBeDefined();
      }
    });
  });
});
