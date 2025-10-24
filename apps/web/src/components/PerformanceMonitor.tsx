'use client';

import { useEffect } from 'react';
import { trackWebVitals } from '@/lib/utils/performance-monitoring';

/**
 * Performance monitoring component
 * Tracks Core Web Vitals and performance metrics
 */
export default function PerformanceMonitor() {
  useEffect(() => {
    // Track web vitals on client-side
    trackWebVitals();
  }, []);

  return null; // This component doesn't render anything
}
