/**
 * Analytics event tracking helpers for conversion funnel.
 * Uses Vercel Analytics for tracking user behavior.
 */

import { track } from '@vercel/analytics';

// Conversion funnel event types
export type AnalyticsEvent =
  | 'homepage_demo_poll_view'
  | 'homepage_demo_vote'
  | 'homepage_view_results'
  | 'homepage_cta_click'
  | 'homepage_browse_click';

/**
 * Track a conversion funnel event
 * @param eventName - The name of the event to track
 * @param properties - Optional properties to track with the event
 */
export function trackEvent(
  eventName: AnalyticsEvent,
  properties?: Record<string, string | number | boolean>
) {
  if (typeof window === 'undefined') return;

  try {
    track(eventName, properties);
  } catch (error) {
    // Fail silently - don't break the app if analytics fails
    console.warn('Analytics tracking failed:', error);
  }
}

/**
 * Track homepage demo poll view (user lands on homepage)
 */
export function trackHomepageView() {
  trackEvent('homepage_demo_poll_view');
}

/**
 * Track homepage demo vote
 * @param choice - The option the user voted for
 * @param pollId - The ID of the poll
 */
export function trackHomepageVote(
  choice: 'option_a' | 'option_b',
  pollId: string
) {
  trackEvent('homepage_demo_vote', { choice, pollId });
}

/**
 * Track homepage view results (after voting)
 * @param winningOption - The winning option
 * @param margin - The percentage margin between options
 * @param totalVotes - Total number of votes
 */
export function trackHomepageViewResults(
  winningOption: 'option_a' | 'option_b',
  margin: number,
  totalVotes: number
) {
  trackEvent('homepage_view_results', { winningOption, margin, totalVotes });
}

/**
 * Track CTA click (Create or Browse)
 * @param action - Which CTA was clicked ('create' or 'browse')
 */
export function trackHomepageCTAClick(action: 'create' | 'browse') {
  if (action === 'browse') {
    trackEvent('homepage_browse_click', { action });
  } else {
    trackEvent('homepage_cta_click', { action });
  }
}
