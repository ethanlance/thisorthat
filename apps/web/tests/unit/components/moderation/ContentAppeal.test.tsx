import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ContentAppeal from '@/components/moderation/ContentAppeal';

// Mock fetch
global.fetch = vi.fn();

describe('ContentAppeal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
    expect(screen.getByText('poll Content')).toBeInTheDocument();
    expect(screen.getByText('Content ID: poll-123')).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    render(
      <ContentAppeal
        moderationActionId="action-123"
        contentType="poll"
        contentId="poll-123"
      />
    );

    // Try to submit without filling in the reason
    const submitButton = screen.getByText('Submit Appeal');
    fireEvent.click(submitButton);

    expect(screen.getByText('Please provide a reason for your appeal')).toBeInTheDocument();
  });

  it('should submit an appeal successfully', async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const onAppealSubmitted = vi.fn();

    render(
      <ContentAppeal
        moderationActionId="action-123"
        contentType="poll"
        contentId="poll-123"
        onAppealSubmitted={onAppealSubmitted}
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

    expect(onAppealSubmitted).toHaveBeenCalled();
  });

  it('should handle submission error', async () => {
    (fetch as any).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Failed to submit appeal' }),
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
      expect(screen.getByText('Failed to submit appeal')).toBeInTheDocument();
    });
  });

  it('should show success state after submission', async () => {
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
      expect(screen.getByText('Appeal Submitted')).toBeInTheDocument();
      expect(screen.getByText('Your appeal has been submitted and will be reviewed by our moderation team')).toBeInTheDocument();
    });
  });

  it('should limit appeal reason character count', () => {
    render(
      <ContentAppeal
        moderationActionId="action-123"
        contentType="poll"
        contentId="poll-123"
      />
    );

    const reasonInput = screen.getByPlaceholderText(/explain why/i);
    fireEvent.change(reasonInput, { target: { value: 'a'.repeat(1001) } });

    expect(screen.getByText('1001/1000 characters')).toBeInTheDocument();
  });

  it('should show appeal guidelines', () => {
    render(
      <ContentAppeal
        moderationActionId="action-123"
        contentType="poll"
        contentId="poll-123"
      />
    );

    expect(screen.getByText('Appeal Guidelines:')).toBeInTheDocument();
    expect(screen.getByText('Be respectful and constructive in your appeal')).toBeInTheDocument();
    expect(screen.getByText('Provide specific reasons why you believe the decision was incorrect')).toBeInTheDocument();
    expect(screen.getByText('Include any relevant context or evidence')).toBeInTheDocument();
    expect(screen.getByText('Appeals are reviewed by human moderators')).toBeInTheDocument();
    expect(screen.getByText('You will be notified of the decision via email')).toBeInTheDocument();
  });

  it('should show different content types', () => {
    const { rerender } = render(
      <ContentAppeal
        moderationActionId="action-123"
        contentType="comment"
        contentId="comment-123"
      />
    );

    expect(screen.getByText('comment Content')).toBeInTheDocument();

    rerender(
      <ContentAppeal
        moderationActionId="action-123"
        contentType="image"
        contentId="image-123"
      />
    );

    expect(screen.getByText('image Content')).toBeInTheDocument();
  });

  it('should disable submit button when loading', async () => {
    (fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves

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

    // Button should be disabled and show loading state
    expect(screen.getByText('Submitting...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submitting/i })).toBeDisabled();
  });

  it('should trim appeal reason before submission', async () => {
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

    // Fill in appeal reason with extra whitespace
    const reasonInput = screen.getByPlaceholderText(/explain why/i);
    fireEvent.change(reasonInput, { target: { value: '  This was a mistake  ' } });

    // Submit the appeal
    const submitButton = screen.getByText('Submit Appeal');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/content/appeal', expect.objectContaining({
        body: expect.stringContaining('"appeal_reason":"This was a mistake"'),
      }));
    });
  });
});
