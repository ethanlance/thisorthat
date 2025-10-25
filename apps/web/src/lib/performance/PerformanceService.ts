export interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte

  // Custom metrics
  pageLoadTime?: number;
  apiResponseTime?: number;
  imageLoadTime?: number;
  bundleSize?: number;

  // User experience metrics
  userAgent?: string;
  connectionType?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  timestamp?: number;
}

export interface PerformanceBudget {
  lcp: number; // 2.5s
  fid: number; // 100ms
  cls: number; // 0.1
  fcp: number; // 1.5s
  ttfb: number; // 600ms
  pageLoadTime: number; // 2s
  apiResponseTime: number; // 200ms
  bundleSize: number; // 200KB
}

export class PerformanceService {
  private static instance: PerformanceService;
  private metrics: PerformanceMetrics[] = [];
  private budget: PerformanceBudget = {
    lcp: 2500,
    fid: 100,
    cls: 0.1,
    fcp: 1500,
    ttfb: 600,
    pageLoadTime: 2000,
    apiResponseTime: 200,
    bundleSize: 200 * 1024, // 200KB
  };

  private constructor() {
    this.initializePerformanceMonitoring();
  }

  public static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  private initializePerformanceMonitoring() {
    // Monitor Core Web Vitals
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.observeCoreWebVitals();
      this.observeCustomMetrics();
    }
  }

  private observeCoreWebVitals() {
    // Observe LCP
    try {
      const lcpObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordMetric('lcp', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      console.warn('LCP observation not supported:', error);
    }

    // Observe FID
    try {
      const fidObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.recordMetric('fid', entry.processingStart - entry.startTime);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (error) {
      console.warn('FID observation not supported:', error);
    }

    // Observe CLS
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.recordMetric('cls', clsValue);
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      console.warn('CLS observation not supported:', error);
    }
  }

  private observeCustomMetrics() {
    // Monitor page load time
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.recordMetric(
          'pageLoadTime',
          navigation.loadEventEnd - navigation.fetchStart
        );
        this.recordMetric(
          'ttfb',
          navigation.responseStart - navigation.fetchStart
        );
        this.recordMetric(
          'fcp',
          navigation.domContentLoadedEventEnd - navigation.fetchStart
        );
      }
    });

    // Monitor bundle size
    this.measureBundleSize();
  }

  private measureBundleSize() {
    const scripts = document.querySelectorAll('script[src]');
    let totalSize = 0;

    scripts.forEach(script => {
      const src = (script as HTMLScriptElement).src;
      if (src && !src.includes('chrome-extension')) {
        // Estimate bundle size (in a real implementation, you'd measure actual size)
        totalSize += 50 * 1024; // Estimate 50KB per script
      }
    });

    this.recordMetric('bundleSize', totalSize);
  }

  public recordMetric(name: keyof PerformanceMetrics, value: number) {
    const metric: PerformanceMetrics = {
      [name]: value,
      userAgent: navigator.userAgent,
      connectionType: this.getConnectionType(),
      deviceType: this.getDeviceType(),
      timestamp: Date.now(),
    };

    this.metrics.push(metric);
    this.checkPerformanceBudget(name, value);
  }

  public recordApiResponseTime(url: string, duration: number) {
    this.recordMetric('apiResponseTime', duration);

    // Log slow API calls
    if (duration > this.budget.apiResponseTime) {
      console.warn(`Slow API call: ${url} took ${duration}ms`);
    }
  }

  public recordImageLoadTime(src: string, duration: number) {
    this.recordMetric('imageLoadTime', duration);

    // Log slow image loads
    if (duration > 1000) {
      // 1 second threshold
      console.warn(`Slow image load: ${src} took ${duration}ms`);
    }
  }

  private getConnectionType(): string {
    const connection = (navigator as any).connection;
    return connection ? connection.effectiveType || 'unknown' : 'unknown';
  }

  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private checkPerformanceBudget(
    metric: keyof PerformanceMetrics,
    value: number
  ) {
    const budget = this.budget[metric];
    if (budget && value > budget) {
      console.warn(
        `Performance budget exceeded for ${metric}: ${value}ms (budget: ${budget}ms)`
      );

      // Send to monitoring service
      this.sendToMonitoringService({
        type: 'performance_budget_exceeded',
        metric,
        value,
        budget,
        timestamp: Date.now(),
      });
    }
  }

  public getMetrics(): PerformanceMetrics[] {
    return this.metrics;
  }

  public getLatestMetrics(): PerformanceMetrics | null {
    return this.metrics[this.metrics.length - 1] || null;
  }

  public getPerformanceScore(): number {
    const latest = this.getLatestMetrics();
    if (!latest) return 0;

    let score = 100;

    // Deduct points for each metric that exceeds budget
    if (latest.lcp && latest.lcp > this.budget.lcp) {
      score -= Math.min(30, (latest.lcp - this.budget.lcp) / 100);
    }
    if (latest.fid && latest.fid > this.budget.fid) {
      score -= Math.min(20, (latest.fid - this.budget.fid) / 10);
    }
    if (latest.cls && latest.cls > this.budget.cls) {
      score -= Math.min(20, (latest.cls - this.budget.cls) * 100);
    }
    if (latest.fcp && latest.fcp > this.budget.fcp) {
      score -= Math.min(15, (latest.fcp - this.budget.fcp) / 100);
    }
    if (latest.pageLoadTime && latest.pageLoadTime > this.budget.pageLoadTime) {
      score -= Math.min(
        15,
        (latest.pageLoadTime - this.budget.pageLoadTime) / 100
      );
    }

    return Math.max(0, Math.round(score));
  }

  public getPerformanceReport(): {
    score: number;
    metrics: PerformanceMetrics;
    budget: PerformanceBudget;
    recommendations: string[];
  } {
    const latest = this.getLatestMetrics();
    const score = this.getPerformanceScore();
    const recommendations: string[] = [];

    if (latest) {
      if (latest.lcp && latest.lcp > this.budget.lcp) {
        recommendations.push(
          'Optimize Largest Contentful Paint - consider image optimization and critical resource prioritization'
        );
      }
      if (latest.fid && latest.fid > this.budget.fid) {
        recommendations.push(
          'Reduce First Input Delay - minimize JavaScript execution time'
        );
      }
      if (latest.cls && latest.cls > this.budget.cls) {
        recommendations.push(
          'Reduce Cumulative Layout Shift - ensure proper image dimensions and avoid layout shifts'
        );
      }
      if (latest.fcp && latest.fcp > this.budget.fcp) {
        recommendations.push(
          'Optimize First Contentful Paint - inline critical CSS and optimize resource loading'
        );
      }
      if (
        latest.pageLoadTime &&
        latest.pageLoadTime > this.budget.pageLoadTime
      ) {
        recommendations.push(
          'Improve page load time - implement code splitting and optimize bundle size'
        );
      }
      if (
        latest.apiResponseTime &&
        latest.apiResponseTime > this.budget.apiResponseTime
      ) {
        recommendations.push(
          'Optimize API response times - implement caching and database query optimization'
        );
      }
    }

    return {
      score,
      metrics: latest || {},
      budget: this.budget,
      recommendations,
    };
  }

  private async sendToMonitoringService(data: any) {
    try {
      await fetch('/api/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error(
        'Failed to send performance data to monitoring service:',
        error
      );
    }
  }

  public setBudget(budget: Partial<PerformanceBudget>) {
    this.budget = { ...this.budget, ...budget };
  }

  public getBudget(): PerformanceBudget {
    return { ...this.budget };
  }
}
