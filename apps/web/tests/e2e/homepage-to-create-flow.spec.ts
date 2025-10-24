import { test, expect } from '@playwright/test';

test.describe('Homepage to Create Flow', () => {
  test('complete user journey from homepage to poll creation', async ({
    page,
  }) => {
    // Navigate to homepage
    await page.goto('/');

    // Should see demo poll
    await expect(page.getByText('Test Poll')).toBeVisible();

    // Vote on the demo poll
    await page.getByText('Option A').click();

    // Should see results
    await expect(page.getByText('Results')).toBeVisible();

    // Should see conversion CTAs
    await expect(page.getByText('Create Your Own Poll')).toBeVisible();
    await expect(page.getByText('Browse More Polls')).toBeVisible();

    // Click create CTA
    await page.getByText('Create Your Own Poll').click();

    // Should navigate to create page
    await expect(page).toHaveURL('/poll/create');

    // Should see poll creation form
    await expect(page.getByText('Create a New Poll')).toBeVisible();
  });

  test('navigation simplification works', async ({ page }) => {
    await page.goto('/');

    // Desktop navigation should be simplified
    await expect(page.getByRole('link', { name: 'Browse' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Create' })).toBeVisible();

    // Should not see old navigation items
    await expect(page.getByRole('link', { name: 'Home' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: 'About' })).not.toBeVisible();
  });

  test('mobile bottom action bar works', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');

    // Should see bottom action bar
    await expect(page.getByRole('button', { name: 'Browse' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Profile' })).toBeVisible();

    // Test bottom action bar navigation
    await page.getByRole('button', { name: 'Browse' }).click();
    await expect(page).toHaveURL('/polls');

    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page).toHaveURL('/poll/create');
  });

  test('performance metrics are tracked', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');

    // Wait for page to load
    await expect(page.getByText('Test Poll')).toBeVisible();

    // Check that performance monitoring is working
    const performanceEntries = await page.evaluate(() => {
      return performance.getEntriesByType('navigation');
    });

    expect(performanceEntries.length).toBeGreaterThan(0);

    // Check for Core Web Vitals tracking
    const vitals = await page.evaluate(() => {
      return (window as unknown as { __webVitals?: unknown }).__webVitals;
    });

    // Should have some performance data
    expect(vitals).toBeDefined();
  });

  test('analytics events are fired', async ({ page }) => {
    // Mock analytics
    await page.addInitScript(() => {
      const windowWithAnalytics = window as unknown as {
        va?: (action: string, event: string, data?: unknown) => void;
        __analyticsEvents?: Array<{
          action: string;
          event: string;
          data?: unknown;
        }>;
      };
      windowWithAnalytics.va = (
        action: string,
        event: string,
        data?: unknown
      ) => {
        windowWithAnalytics.__analyticsEvents =
          windowWithAnalytics.__analyticsEvents || [];
        windowWithAnalytics.__analyticsEvents.push({ action, event, data });
      };
    });

    await page.goto('/');

    // Wait for page load
    await expect(page.getByText('Test Poll')).toBeVisible();

    // Check analytics events
    const events = await page.evaluate(() => (window as any).__analyticsEvents);
    expect(events).toContainEqual(
      expect.objectContaining({
        action: 'track',
        event: 'homepage_demo_poll_view',
      })
    );

    // Vote and check for vote tracking
    await page.getByText('Option A').click();

    const voteEvents = await page.evaluate(
      () =>
        (window as unknown as { __analyticsEvents?: Array<unknown> })
          .__analyticsEvents
    );
    expect(voteEvents).toContainEqual(
      expect.objectContaining({
        action: 'track',
        event: 'homepage_demo_vote',
      })
    );
  });

  test('responsive design works across breakpoints', async ({ page }) => {
    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.getByText('Test Poll')).toBeVisible();

    // Test tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await expect(page.getByText('Test Poll')).toBeVisible();

    // Test desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    await expect(page.getByText('Test Poll')).toBeVisible();
  });

  test('accessibility features work', async ({ page }) => {
    await page.goto('/');

    // Check for skip link
    await expect(page.getByText('Skip to main content')).toBeVisible();

    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();

    // Test focus indicators
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toHaveCSS('outline-width', '3px');
  });
});
