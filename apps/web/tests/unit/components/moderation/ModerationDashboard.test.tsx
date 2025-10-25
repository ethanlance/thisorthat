import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ModerationDashboard from '@/components/moderation/ModerationDashboard';

// Mock fetch
global.fetch = vi.fn();

describe('ModerationDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state', () => {
    render(<ModerationDashboard />);
    expect(screen.getByText('Loading moderation dashboard...')).toBeInTheDocument();
  });

  it('should render error state', async () => {
    (fetch as any).mockRejectedValue(new Error('Network error'));

    render(<ModerationDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('should render empty state when no reports', async () => {
    (fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/moderation/queue')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ queue: [] }),
        });
      }
      if (url.includes('/api/moderation/stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            total_reports: 0,
            pending_reports: 0,
            resolved_reports: 0,
            total_actions: 0,
            appeals_pending: 0,
          }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<ModerationDashboard />);

    await waitFor(() => {
      expect(screen.getByText('No pending reports')).toBeInTheDocument();
    });
  });

  it('should render reports list', async () => {
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
      if (url.includes('/api/moderation/stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            total_reports: 1,
            pending_reports: 1,
            resolved_reports: 0,
            total_actions: 0,
            appeals_pending: 0,
          }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<ModerationDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Moderation Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Inappropriate content')).toBeInTheDocument();
    });
  });

  it('should handle report selection', async () => {
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
      if (url.includes('/api/moderation/stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            total_reports: 1,
            pending_reports: 1,
            resolved_reports: 0,
            total_actions: 0,
            appeals_pending: 0,
          }),
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

    // Should show action panel
    expect(screen.getByText('Take Action')).toBeInTheDocument();
  });

  it('should handle moderation action', async () => {
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
      if (url.includes('/api/moderation/stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            total_reports: 1,
            pending_reports: 1,
            resolved_reports: 0,
            total_actions: 0,
            appeals_pending: 0,
          }),
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
