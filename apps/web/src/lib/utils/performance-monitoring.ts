/**
 * Performance monitoring utilities
 * Tracks Core Web Vitals and performance metrics
 */

export interface PerformanceMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
  fmp?: number; // First Meaningful Paint
}

/**
 * Track Core Web Vitals using the web-vitals library
 * This should be called in the client-side code
 */
export function trackWebVitals() {
  if (typeof window === 'undefined') return;

  // Import web-vitals dynamically to avoid SSR issues
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    getCLS(metric => {
      console.log('CLS:', metric.value);
      // Send to analytics service
      sendMetric('cls', metric.value);
    });

    getFID(metric => {
      console.log('FID:', metric.value);
      sendMetric('fid', metric.value);
    });

    getFCP(metric => {
      console.log('FCP:', metric.value);
      sendMetric('fcp', metric.value);
    });

    getLCP(metric => {
      console.log('LCP:', metric.value);
      sendMetric('lcp', metric.value);
    });

    getTTFB(metric => {
      console.log('TTFB:', metric.value);
      sendMetric('ttfb', metric.value);
    });
  });
}

/**
 * Send performance metric to analytics
 */
function sendMetric(name: string, value: number) {
  // Send to Vercel Analytics
  if (typeof window !== 'undefined' && window.va) {
    window.va('track', 'performance_metric', {
      metric: name,
      value: Math.round(value),
      timestamp: Date.now(),
    });
  }

  // Send to custom analytics endpoint if needed
  if (process.env.NODE_ENV === 'production') {
    fetch('/api/analytics/performance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metric: name,
        value: Math.round(value),
        url: window.location.href,
        timestamp: Date.now(),
      }),
    }).catch(error => {
      console.warn('Failed to send performance metric:', error);
    });
  }
}

/**
 * Performance budget checker
 * Alerts when metrics exceed thresholds
 */
export const PERFORMANCE_BUDGETS = {
  fcp: 1500, // 1.5s
  lcp: 2500, // 2.5s
  fid: 100, // 100ms
  cls: 0.1, // 0.1
  ttfb: 600, // 600ms
} as const;

export function checkPerformanceBudget(metrics: PerformanceMetrics): string[] {
  const violations: string[] = [];

  if (metrics.fcp && metrics.fcp > PERFORMANCE_BUDGETS.fcp) {
    violations.push(
      `FCP exceeded budget: ${metrics.fcp}ms > ${PERFORMANCE_BUDGETS.fcp}ms`
    );
  }

  if (metrics.lcp && metrics.lcp > PERFORMANCE_BUDGETS.lcp) {
    violations.push(
      `LCP exceeded budget: ${metrics.lcp}ms > ${PERFORMANCE_BUDGETS.lcp}ms`
    );
  }

  if (metrics.fid && metrics.fid > PERFORMANCE_BUDGETS.fid) {
    violations.push(
      `FID exceeded budget: ${metrics.fid}ms > ${PERFORMANCE_BUDGETS.fid}ms`
    );
  }

  if (metrics.cls && metrics.cls > PERFORMANCE_BUDGETS.cls) {
    violations.push(
      `CLS exceeded budget: ${metrics.cls} > ${PERFORMANCE_BUDGETS.cls}`
    );
  }

  if (metrics.ttfb && metrics.ttfb > PERFORMANCE_BUDGETS.ttfb) {
    violations.push(
      `TTFB exceeded budget: ${metrics.ttfb}ms > ${PERFORMANCE_BUDGETS.ttfb}ms`
    );
  }

  return violations;
}

/**
 * Performance monitoring hook for React components
 */
export function usePerformanceMonitoring() {
  if (typeof window === 'undefined') return;

  // Track page load performance
  const trackPageLoad = () => {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = window.performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;

      if (navigation) {
        const metrics: PerformanceMetrics = {
          ttfb: navigation.responseStart - navigation.requestStart,
          fcp: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        };

        const violations = checkPerformanceBudget(metrics);
        if (violations.length > 0) {
          console.warn('Performance budget violations:', violations);
        }
      }
    }
  };

  return { trackPageLoad };
}

// Extend Window interface for Vercel Analytics
declare global {
  interface Window {
    va?: (action: string, event: string, data?: any) => void;
  }
}
