import React, { useEffect, useCallback, useMemo, useRef } from 'react';
import {
  PerformanceService,
  PerformanceMetrics,
} from '@/lib/performance/PerformanceService';

export function usePerformance() {
  const performanceService = PerformanceService.getInstance();

  const recordMetric = useCallback(
    (name: keyof PerformanceMetrics, value: number) => {
      performanceService.recordMetric(name, value);
    },
    [performanceService]
  );

  const recordApiResponseTime = useCallback(
    (url: string, duration: number) => {
      performanceService.recordApiResponseTime(url, duration);
    },
    [performanceService]
  );

  const recordImageLoadTime = useCallback(
    (src: string, duration: number) => {
      performanceService.recordImageLoadTime(src, duration);
    },
    [performanceService]
  );

  const getPerformanceScore = useCallback(() => {
    return performanceService.getPerformanceScore();
  }, [performanceService]);

  const getPerformanceReport = useCallback(() => {
    return performanceService.getPerformanceReport();
  }, [performanceService]);

  return {
    recordMetric,
    recordApiResponseTime,
    recordImageLoadTime,
    getPerformanceScore,
    getPerformanceReport,
  };
}

export function useOptimizedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  deps: React.DependencyList
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(callback, deps);
}

export function useOptimizedMemo<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}

export function useLazyLoading<T>(
  data: T[],
  pageSize: number = 10
): {
  items: T[];
  hasMore: boolean;
  loadMore: () => void;
  isLoading: boolean;
} {
  const [items, setItems] = React.useState<T[]>([]);
  const [currentPage, setCurrentPage] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);

  const hasMore = currentPage * pageSize < data.length;

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);

    // Simulate loading delay
    setTimeout(() => {
      const startIndex = currentPage * pageSize;
      const endIndex = startIndex + pageSize;
      const newItems = data.slice(startIndex, endIndex);

      setItems(prev => [...prev, ...newItems]);
      setCurrentPage(prev => prev + 1);
      setIsLoading(false);
    }, 100);
  }, [currentPage, pageSize, data, isLoading, hasMore]);

  useEffect(() => {
    if (data.length > 0 && items.length === 0) {
      loadMore();
    }
  }, [data, items.length, loadMore]);

  return {
    items,
    hasMore,
    loadMore,
    isLoading,
  };
}

export function useIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    observerRef.current = new IntersectionObserver(callback, {
      rootMargin: '50px',
      threshold: 0.1,
      ...options,
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [callback, options]);

  const observe = useCallback((element: HTMLElement | null) => {
    if (observerRef.current && element) {
      observerRef.current.observe(element);
      elementRef.current = element;
    }
  }, []);

  const unobserve = useCallback(() => {
    if (observerRef.current && elementRef.current) {
      observerRef.current.unobserve(elementRef.current);
    }
  }, []);

  return { observe, unobserve };
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());

  return useCallback(
    (...args: Parameters<T>) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    },
    [callback, delay]
  ) as T;
}

export function usePerformanceMonitoring() {
  const performanceService = PerformanceService.getInstance();
  const [metrics, setMetrics] = React.useState(performanceService.getMetrics());

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(performanceService.getMetrics());
    }, 1000);

    return () => clearInterval(interval);
  }, [performanceService]);

  return {
    metrics,
    score: performanceService.getPerformanceScore(),
    report: performanceService.getPerformanceReport(),
  };
}
