export interface AnalyticsEvent {
  id: string;
  userId?: string;
  sessionId: string;
  event: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  properties: Record<string, unknown>;
  timestamp: number;
  url: string;
  userAgent: string;
  referrer?: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  connectionType?: string;
}

export interface UserSession {
  id: string;
  userId?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  pageViews: number;
  events: number;
  referrer?: string;
  userAgent: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  connectionType?: string;
  isActive: boolean;
}

export interface PollAnalytics {
  pollId: string;
  views: number;
  votes: number;
  shares: number;
  comments: number;
  completionRate: number;
  averageTimeOnPoll: number;
  bounceRate: number;
  conversionRate: number;
  engagementScore: number;
  trendingScore: number;
}

export interface UserAnalytics {
  userId: string;
  totalSessions: number;
  averageSessionDuration: number;
  totalPageViews: number;
  totalEvents: number;
  favoriteCategories: string[];
  engagementScore: number;
  retentionRate: number;
  lastActiveAt: number;
  createdAt: number;
}

export interface BusinessMetrics {
  dailyActiveUsers: number;
  monthlyActiveUsers: number;
  totalUsers: number;
  newUsers: number;
  returningUsers: number;
  userRetentionRate: number;
  averageSessionDuration: number;
  bounceRate: number;
  conversionRate: number;
  totalPolls: number;
  totalVotes: number;
  totalShares: number;
  engagementRate: number;
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private events: AnalyticsEvent[] = [];
  private sessions: Map<string, UserSession> = new Map();
  private currentSession: UserSession | null = null;
  private isEnabled: boolean = true;
  private batchSize: number = 10;
  private flushInterval: number = 30000; // 30 seconds
  private flushTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeSession();
    this.startFlushTimer();
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  private initializeSession() {
    const sessionId = this.generateSessionId();
    this.currentSession = {
      id: sessionId,
      startTime: Date.now(),
      pageViews: 0,
      events: 0,
      userAgent: navigator.userAgent,
      deviceType: this.getDeviceType(),
      connectionType: this.getConnectionType(),
      isActive: true,
    };
    this.sessions.set(sessionId, this.currentSession);
  }

  private startFlushTimer() {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  public track(
    event: string,
    category: string,
    action: string,
    label?: string,
    value?: number,
    properties: Record<string, unknown> = {}
  ): void {
    if (!this.isEnabled || !this.currentSession) return;

    const analyticsEvent: AnalyticsEvent = {
      id: this.generateEventId(),
      sessionId: this.currentSession.id,
      event,
      category,
      action,
      label,
      value,
      properties,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      deviceType: this.getDeviceType(),
      connectionType: this.getConnectionType(),
    };

    this.events.push(analyticsEvent);
    this.currentSession.events++;

    // Flush if batch size reached
    if (this.events.length >= this.batchSize) {
      this.flush();
    }
  }

  public trackPageView(page: string, title?: string): void {
    if (!this.currentSession) return;

    this.currentSession.pageViews++;

    this.track('page_view', 'navigation', 'view', page, undefined, {
      page,
      title: title || document.title,
      referrer: document.referrer,
    });
  }

  public trackUserAction(
    action: string,
    category: string,
    label?: string,
    value?: number,
    properties: Record<string, unknown> = {}
  ): void {
    this.track('user_action', category, action, label, value, properties);
  }

  public trackPollEvent(
    pollId: string,
    action: 'view' | 'vote' | 'share' | 'comment' | 'create' | 'delete',
    properties: Record<string, unknown> = {}
  ): void {
    this.track('poll_event', 'poll', action, pollId, undefined, {
      pollId,
      ...properties,
    });
  }

  public trackSocialEvent(
    action:
      | 'follow'
      | 'unfollow'
      | 'friend_request'
      | 'group_join'
      | 'group_leave',
    targetUserId?: string,
    properties: Record<string, unknown> = {}
  ): void {
    this.track('social_event', 'social', action, targetUserId, undefined, {
      targetUserId,
      ...properties,
    });
  }

  public trackPerformance(
    metric: string,
    value: number,
    properties: Record<string, unknown> = {}
  ): void {
    this.track('performance_metric', 'performance', 'measure', metric, value, {
      metric,
      ...properties,
    });
  }

  public trackError(
    error: Error,
    context: string,
    properties: Record<string, unknown> = {}
  ): void {
    this.track('error', 'error', 'occurred', error.name, undefined, {
      error: error.message,
      stack: error.stack,
      context,
      ...properties,
    });
  }

  public setUserId(userId: string): void {
    if (this.currentSession) {
      this.currentSession.userId = userId;
    }
  }

  public endSession(): void {
    if (this.currentSession) {
      this.currentSession.endTime = Date.now();
      this.currentSession.duration =
        this.currentSession.endTime - this.currentSession.startTime;
      this.currentSession.isActive = false;
    }
  }

  public startNewSession(): void {
    this.endSession();
    this.initializeSession();
  }

  public async flush(): Promise<void> {
    if (this.events.length === 0) return;

    const eventsToFlush = [...this.events];
    this.events = [];

    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events: eventsToFlush }),
      });
    } catch (error) {
      console.error('Failed to flush analytics events:', error);
      // Re-add events to queue if flush failed
      this.events.unshift(...eventsToFlush);
    }
  }

  public getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  public getCurrentSession(): UserSession | null {
    return this.currentSession;
  }

  public getSessions(): UserSession[] {
    return Array.from(this.sessions.values());
  }

  public getSessionById(sessionId: string): UserSession | undefined {
    return this.sessions.get(sessionId);
  }

  public async getBusinessMetrics(): Promise<BusinessMetrics> {
    try {
      const response = await fetch('/api/analytics/business-metrics');
      const data = await response.json();
      return data.metrics;
    } catch (error) {
      console.error('Failed to get business metrics:', error);
      return this.getDefaultBusinessMetrics();
    }
  }

  public async getPollAnalytics(pollId: string): Promise<PollAnalytics> {
    try {
      const response = await fetch(`/api/analytics/polls/${pollId}`);
      const data = await response.json();
      return data.analytics;
    } catch (error) {
      console.error('Failed to get poll analytics:', error);
      return this.getDefaultPollAnalytics(pollId);
    }
  }

  public async getUserAnalytics(userId: string): Promise<UserAnalytics> {
    try {
      const response = await fetch(`/api/analytics/users/${userId}`);
      const data = await response.json();
      return data.analytics;
    } catch (error) {
      console.error('Failed to get user analytics:', error);
      return this.getDefaultUserAnalytics(userId);
    }
  }

  public enable(): void {
    this.isEnabled = true;
  }

  public disable(): void {
    this.isEnabled = false;
  }

  public setBatchSize(size: number): void {
    this.batchSize = size;
  }

  public setFlushInterval(interval: number): void {
    this.flushInterval = interval;
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.startFlushTimer();
    }
  }

  private generateEventId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private getConnectionType(): string {
    const connection = (
      navigator as Navigator & { connection?: { effectiveType?: string } }
    ).connection;
    return connection ? connection.effectiveType || 'unknown' : 'unknown';
  }

  private getDefaultBusinessMetrics(): BusinessMetrics {
    return {
      dailyActiveUsers: 0,
      monthlyActiveUsers: 0,
      totalUsers: 0,
      newUsers: 0,
      returningUsers: 0,
      userRetentionRate: 0,
      averageSessionDuration: 0,
      bounceRate: 0,
      conversionRate: 0,
      totalPolls: 0,
      totalVotes: 0,
      totalShares: 0,
      engagementRate: 0,
    };
  }

  private getDefaultPollAnalytics(pollId: string): PollAnalytics {
    return {
      pollId,
      views: 0,
      votes: 0,
      shares: 0,
      comments: 0,
      completionRate: 0,
      averageTimeOnPoll: 0,
      bounceRate: 0,
      conversionRate: 0,
      engagementScore: 0,
      trendingScore: 0,
    };
  }

  private getDefaultUserAnalytics(userId: string): UserAnalytics {
    return {
      userId,
      totalSessions: 0,
      averageSessionDuration: 0,
      totalPageViews: 0,
      totalEvents: 0,
      favoriteCategories: [],
      engagementScore: 0,
      retentionRate: 0,
      lastActiveAt: Date.now(),
      createdAt: Date.now(),
    };
  }

  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}
