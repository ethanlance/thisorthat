import { ApiCacheService } from './CacheService';
import { PerformanceService } from './PerformanceService';

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  cache?: boolean;
  cacheTTL?: number;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  cached: boolean;
  duration: number;
}

export class OptimizedApiService {
  private cache: ApiCacheService;
  private performanceService: PerformanceService;
  private baseURL: string;

  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
    this.cache = new ApiCacheService();
    this.performanceService = PerformanceService.getInstance();
  }

  public async request<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      body,
      cache = true,
      cacheTTL,
      retries = 3,
      retryDelay = 1000,
    } = options;

    const url = `${this.baseURL}${endpoint}`;
    const cacheKey = this.generateCacheKey(url, method, body);

    // Check cache for GET requests
    if (method === 'GET' && cache) {
      const cached = await this.cache.get(
        cacheKey,
        () => this.makeRequest(url, options),
        cacheTTL
      );
      if (cached) {
        return {
          data: cached as T,
          status: 200,
          statusText: 'OK',
          headers: new Headers(),
          cached: true,
          duration: 0,
        };
      }
    }

    // Make request with retry logic
    return this.makeRequestWithRetry(url, options, retries, retryDelay);
  }

  private async makeRequestWithRetry<T>(
    url: string,
    options: ApiRequestOptions,
    retries: number,
    retryDelay: number
  ): Promise<ApiResponse<T>> {
    let lastError: Error;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const startTime = Date.now();
        const response = await this.makeRequest(url, options);
        const duration = Date.now() - startTime;

        // Record performance metric
        this.performanceService.recordApiResponseTime(url, duration);

        return {
          data: response as T,
          status: 200,
          statusText: 'OK',
          headers: new Headers(),
          cached: false,
          duration,
        };
      } catch (error) {
        lastError = error as Error;

        if (attempt === retries) {
          break;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }

    throw lastError!;
  }

  private async makeRequest<T>(
    url: string,
    options: ApiRequestOptions
  ): Promise<T> {
    const { method = 'GET', body, timeout = 10000, headers = {} } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private generateCacheKey(
    url: string,
    method: string,
    body?: unknown
  ): string {
    const bodyHash = body ? JSON.stringify(body) : '';
    return `${method}:${url}:${bodyHash}`;
  }

  // Convenience methods
  public async get<T>(
    endpoint: string,
    options: Omit<ApiRequestOptions, 'method'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public async post<T>(
    endpoint: string,
    body: unknown,
    options: Omit<ApiRequestOptions, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  public async put<T>(
    endpoint: string,
    body: unknown,
    options: Omit<ApiRequestOptions, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  public async delete<T>(
    endpoint: string,
    options: Omit<ApiRequestOptions, 'method'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  public async patch<T>(
    endpoint: string,
    body: unknown,
    options: Omit<ApiRequestOptions, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  // Cache management
  public invalidateCache(pattern?: string): void {
    this.cache.invalidate(pattern);
  }

  public getCacheStats() {
    return this.cache.getStats();
  }

  // Batch requests
  public async batch<T>(
    requests: Array<{
      endpoint: string;
      options?: ApiRequestOptions;
    }>
  ): Promise<Array<ApiResponse<T>>> {
    const promises = requests.map(({ endpoint, options }) =>
      this.request<T>(endpoint, options)
    );

    return Promise.all(promises);
  }

  // Request deduplication
  private pendingRequests = new Map<string, Promise<unknown>>();

  public async deduplicatedRequest<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const key = this.generateCacheKey(
      endpoint,
      options.method || 'GET',
      options.body
    );

    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)! as Promise<ApiResponse<T>>;
    }

    const promise = this.request<T>(endpoint, options);
    this.pendingRequests.set(key, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      this.pendingRequests.delete(key);
    }
  }
}

// Singleton instance
export const apiService = new OptimizedApiService();
