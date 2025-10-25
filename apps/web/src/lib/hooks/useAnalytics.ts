import { useEffect, useCallback, useRef } from 'react';
import { AnalyticsService } from '@/lib/analytics/AnalyticsService';

export function useAnalytics() {
  const analyticsService = AnalyticsService.getInstance();

  const track = useCallback(
    (
      event: string,
      category: string,
      action: string,
      label?: string,
      value?: number,
      properties: Record<string, any> = {}
    ) => {
      analyticsService.track(event, category, action, label, value, properties);
    },
    [analyticsService]
  );

  const trackPageView = useCallback(
    (page: string, title?: string) => {
      analyticsService.trackPageView(page, title);
    },
    [analyticsService]
  );

  const trackUserAction = useCallback(
    (
      action: string,
      category: string,
      label?: string,
      value?: number,
      properties: Record<string, any> = {}
    ) => {
      analyticsService.trackUserAction(
        action,
        category,
        label,
        value,
        properties
      );
    },
    [analyticsService]
  );

  const trackPollEvent = useCallback(
    (
      pollId: string,
      action: 'view' | 'vote' | 'share' | 'comment' | 'create' | 'delete',
      properties: Record<string, any> = {}
    ) => {
      analyticsService.trackPollEvent(pollId, action, properties);
    },
    [analyticsService]
  );

  const trackSocialEvent = useCallback(
    (
      action:
        | 'follow'
        | 'unfollow'
        | 'friend_request'
        | 'group_join'
        | 'group_leave',
      targetUserId?: string,
      properties: Record<string, any> = {}
    ) => {
      analyticsService.trackSocialEvent(action, targetUserId, properties);
    },
    [analyticsService]
  );

  const trackPerformance = useCallback(
    (metric: string, value: number, properties: Record<string, any> = {}) => {
      analyticsService.trackPerformance(metric, value, properties);
    },
    [analyticsService]
  );

  const trackError = useCallback(
    (error: Error, context: string, properties: Record<string, any> = {}) => {
      analyticsService.trackError(error, context, properties);
    },
    [analyticsService]
  );

  const setUserId = useCallback(
    (userId: string) => {
      analyticsService.setUserId(userId);
    },
    [analyticsService]
  );

  return {
    track,
    trackPageView,
    trackUserAction,
    trackPollEvent,
    trackSocialEvent,
    trackPerformance,
    trackError,
    setUserId,
  };
}

export function usePageTracking(page: string, title?: string) {
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView(page, title);
  }, [page, title, trackPageView]);
}

export function useUserTracking(userId?: string) {
  const { setUserId } = useAnalytics();

  useEffect(() => {
    if (userId) {
      setUserId(userId);
    }
  }, [userId, setUserId]);
}

export function usePollTracking(pollId: string) {
  const { trackPollEvent } = useAnalytics();

  const trackView = useCallback(() => {
    trackPollEvent(pollId, 'view');
  }, [pollId, trackPollEvent]);

  const trackVote = useCallback(
    (option: string) => {
      trackPollEvent(pollId, 'vote', { option });
    },
    [pollId, trackPollEvent]
  );

  const trackShare = useCallback(
    (platform: string) => {
      trackPollEvent(pollId, 'share', { platform });
    },
    [pollId, trackPollEvent]
  );

  const trackComment = useCallback(() => {
    trackPollEvent(pollId, 'comment');
  }, [pollId, trackPollEvent]);

  return {
    trackView,
    trackVote,
    trackShare,
    trackComment,
  };
}

export function useSocialTracking() {
  const { trackSocialEvent } = useAnalytics();

  const trackFollow = useCallback(
    (targetUserId: string) => {
      trackSocialEvent('follow', targetUserId);
    },
    [trackSocialEvent]
  );

  const trackUnfollow = useCallback(
    (targetUserId: string) => {
      trackSocialEvent('unfollow', targetUserId);
    },
    [trackSocialEvent]
  );

  const trackFriendRequest = useCallback(
    (targetUserId: string) => {
      trackSocialEvent('friend_request', targetUserId);
    },
    [trackSocialEvent]
  );

  const trackGroupJoin = useCallback(
    (groupId: string) => {
      trackSocialEvent('group_join', undefined, { groupId });
    },
    [trackSocialEvent]
  );

  const trackGroupLeave = useCallback(
    (groupId: string) => {
      trackSocialEvent('group_leave', undefined, { groupId });
    },
    [trackSocialEvent]
  );

  return {
    trackFollow,
    trackUnfollow,
    trackFriendRequest,
    trackGroupJoin,
    trackGroupLeave,
  };
}

export function usePerformanceTracking() {
  const { trackPerformance } = useAnalytics();
  const startTime = useRef<number>(Date.now());

  const trackPageLoad = useCallback(() => {
    const loadTime = Date.now() - startTime.current;
    trackPerformance('page_load_time', loadTime);
  }, [trackPerformance]);

  const trackApiCall = useCallback(
    (endpoint: string, duration: number) => {
      trackPerformance('api_response_time', duration, { endpoint });
    },
    [trackPerformance]
  );

  const trackImageLoad = useCallback(
    (src: string, duration: number) => {
      trackPerformance('image_load_time', duration, { src });
    },
    [trackPerformance]
  );

  const trackBundleSize = useCallback(
    (size: number) => {
      trackPerformance('bundle_size', size);
    },
    [trackPerformance]
  );

  useEffect(() => {
    startTime.current = Date.now();
  }, []);

  return {
    trackPageLoad,
    trackApiCall,
    trackImageLoad,
    trackBundleSize,
  };
}

export function useErrorTracking() {
  const { trackError } = useAnalytics();

  const trackComponentError = useCallback(
    (error: Error, component: string) => {
      trackError(error, `component:${component}`);
    },
    [trackError]
  );

  const trackApiError = useCallback(
    (error: Error, endpoint: string) => {
      trackError(error, `api:${endpoint}`);
    },
    [trackError]
  );

  const trackNetworkError = useCallback(
    (error: Error) => {
      trackError(error, 'network');
    },
    [trackError]
  );

  const trackValidationError = useCallback(
    (error: Error, field: string) => {
      trackError(error, `validation:${field}`);
    },
    [trackError]
  );

  return {
    trackComponentError,
    trackApiError,
    trackNetworkError,
    trackValidationError,
  };
}
