import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReportContent from '@/components/moderation/ReportContent';

// Mock fetch
global.fetch = vi.fn();

describe('ReportContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render report form', () => {
    render(
      <ReportContent
        contentType="poll"
        contentId="poll-123"
        onReportSubmitted={() => {}}
      />
    );

    expect(screen.getByText('Report Content')).toBeInTheDocument();
    expect(screen.getByText("What's the issue? *")).toBeInTheDocument();
    expect(
      screen.getByText('Additional Details (Optional)')
    ).toBeInTheDocument();
  });

  it('should show content type badge', () => {
    render(
      <ReportContent
        contentType="poll"
        contentId="poll-123"
        onReportSubmitted={() => {}}
      />
    );

    expect(screen.getByText('poll')).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
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

    // Try to submit without selecting a category
    const submitButton = screen.getByText('Submit Report');
    fireEvent.click(submitButton);

    expect(
      screen.getByText('Please select a report category')
    ).toBeInTheDocument();
  });

  it('should submit a report successfully', async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const onReportSubmitted = vi.fn();

    render(
      <ReportContent
        contentType="poll"
        contentId="poll-123"
        onReportSubmitted={onReportSubmitted}
      />
    );

    // Select a category
    const categorySelect = screen.getByRole('combobox');
    fireEvent.click(categorySelect);

    // Fill in description
    const descriptionInput = screen.getByPlaceholderText(/additional context/i);
    fireEvent.change(descriptionInput, {
      target: { value: 'This is inappropriate' },
    });

    // Submit the form
    const submitButton = screen.getByText('Submit Report');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/content/report',
        expect.any(Object)
      );
    });

    expect(onReportSubmitted).toHaveBeenCalled();
  });

  it('should handle submission error', async () => {
    (fetch as any).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Failed to submit report' }),
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

    // Submit the form
    const submitButton = screen.getByText('Submit Report');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to submit report')).toBeInTheDocument();
    });
  });

  it('should show success state after submission', async () => {
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

    // Submit the form
    const submitButton = screen.getByText('Submit Report');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Report Submitted')).toBeInTheDocument();
      expect(
        screen.getByText('Thank you for helping keep our community safe')
      ).toBeInTheDocument();
    });
  });

  it('should limit description character count', () => {
    render(
      <ReportContent
        contentType="poll"
        contentId="poll-123"
        onReportSubmitted={() => {}}
      />
    );

    const descriptionInput = screen.getByPlaceholderText(/additional context/i);
    fireEvent.change(descriptionInput, { target: { value: 'a'.repeat(501) } });

    expect(screen.getByText('501/500 characters')).toBeInTheDocument();
  });

  it('should show all report categories', () => {
    render(
      <ReportContent
        contentType="poll"
        contentId="poll-123"
        onReportSubmitted={() => {}}
      />
    );

    const categorySelect = screen.getByRole('combobox');
    fireEvent.click(categorySelect);

    expect(screen.getByText('Inappropriate Content')).toBeInTheDocument();
    expect(screen.getByText('Spam')).toBeInTheDocument();
    expect(screen.getByText('Harassment')).toBeInTheDocument();
    expect(screen.getByText('Violence')).toBeInTheDocument();
    expect(screen.getByText('Hate Speech')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });
});
