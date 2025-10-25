export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of items
  strategy?: 'lru' | 'fifo' | 'ttl'; // Cache eviction strategy
}

export interface CacheItem<T> {
  value: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

export class CacheService {
  private static instance: CacheService;
  private cache: Map<string, CacheItem<any>> = new Map();
  private options: CacheOptions;
  private maxSize: number;
  private strategy: 'lru' | 'fifo' | 'ttl';

  private constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: 5 * 60 * 1000, // 5 minutes default
      maxSize: 100, // 100 items default
      strategy: 'lru',
      ...options,
    };
    this.maxSize = this.options.maxSize!;
    this.strategy = this.options.strategy!;
  }

  public static getInstance(options?: CacheOptions): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService(options);
    }
    return CacheService.instance;
  }

  public set<T>(key: string, value: T, ttl?: number): void {
    const item: CacheItem<T> = {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.options.ttl!,
      accessCount: 0,
      lastAccessed: Date.now(),
    };

    // Check if we need to evict items
    if (this.cache.size >= this.maxSize) {
      this.evict();
    }

    this.cache.set(key, item);
  }

  public get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // Check if item has expired
    if (this.isExpired(item)) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    item.accessCount++;
    item.lastAccessed = Date.now();

    return item.value;
  }

  public has(key: string): boolean {
    const item = this.cache.get(key);
    return item ? !this.isExpired(item) : false;
  }

  public delete(key: string): boolean {
    return this.cache.delete(key);
  }

  public clear(): void {
    this.cache.clear();
  }

  public size(): number {
    return this.cache.size;
  }

  public keys(): string[] {
    return Array.from(this.cache.keys());
  }

  public getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    missRate: number;
    totalAccesses: number;
    averageAccessTime: number;
  } {
    let totalAccesses = 0;
    let totalAccessTime = 0;
    let hits = 0;
    let misses = 0;

    for (const item of this.cache.values()) {
      totalAccesses += item.accessCount;
      totalAccessTime += item.lastAccessed - item.timestamp;
      if (item.accessCount > 0) {
        hits++;
      } else {
        misses++;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: hits / (hits + misses) || 0,
      missRate: misses / (hits + misses) || 0,
      totalAccesses,
      averageAccessTime: totalAccessTime / totalAccesses || 0,
    };
  }

  private isExpired(item: CacheItem<any>): boolean {
    return Date.now() - item.timestamp > item.ttl;
  }

  private evict(): void {
    switch (this.strategy) {
      case 'lru':
        this.evictLRU();
        break;
      case 'fifo':
        this.evictFIFO();
        break;
      case 'ttl':
        this.evictTTL();
        break;
    }
  }

  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private evictFIFO(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private evictTTL(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
  }

  public cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
  }

  public setOptions(options: Partial<CacheOptions>): void {
    this.options = { ...this.options, ...options };
    this.maxSize = this.options.maxSize!;
    this.strategy = this.options.strategy!;
  }
}

// API Cache Service
export class ApiCacheService {
  private cache: CacheService;
  private performanceService: any;

  constructor() {
    this.cache = CacheService.getInstance({
      ttl: 5 * 60 * 1000, // 5 minutes
      maxSize: 200,
      strategy: 'lru',
    });
  }

  public async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Check cache first
    const cached = this.cache.get<T>(key);
    if (cached) {
      return cached;
    }

    // Fetch from source
    const startTime = Date.now();
    try {
      const data = await fetcher();
      const duration = Date.now() - startTime;

      // Record performance metric
      if (this.performanceService) {
        this.performanceService.recordApiResponseTime(key, duration);
      }

      // Cache the result
      this.cache.set(key, data, ttl);

      return data;
    } catch (error) {
      console.error('API cache fetch error:', error);
      throw error;
    }
  }

  public invalidate(pattern?: string): void {
    if (pattern) {
      const keys = this.cache.keys();
      keys.forEach(key => {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      });
    } else {
      this.cache.clear();
    }
  }

  public getStats() {
    return this.cache.getStats();
  }
}

// Browser Cache Service
export class BrowserCacheService {
  private static readonly CACHE_PREFIX = 'thisorthat_';
  private static readonly CACHE_VERSION = '1.0.0';

  public static set<T>(key: string, value: T, ttl?: number): void {
    try {
      const item = {
        value,
        timestamp: Date.now(),
        ttl: ttl || 5 * 60 * 1000, // 5 minutes default
        version: BrowserCacheService.CACHE_VERSION,
      };

      localStorage.setItem(
        `${BrowserCacheService.CACHE_PREFIX}${key}`,
        JSON.stringify(item)
      );
    } catch (error) {
      console.warn('Failed to set browser cache:', error);
    }
  }

  public static get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(
        `${BrowserCacheService.CACHE_PREFIX}${key}`
      );
      if (!item) return null;

      const parsed = JSON.parse(item);

      // Check version
      if (parsed.version !== BrowserCacheService.CACHE_VERSION) {
        BrowserCacheService.delete(key);
        return null;
      }

      // Check TTL
      if (Date.now() - parsed.timestamp > parsed.ttl) {
        BrowserCacheService.delete(key);
        return null;
      }

      return parsed.value;
    } catch (error) {
      console.warn('Failed to get browser cache:', error);
      return null;
    }
  }

  public static has(key: string): boolean {
    return BrowserCacheService.get(key) !== null;
  }

  public static delete(key: string): void {
    try {
      localStorage.removeItem(`${BrowserCacheService.CACHE_PREFIX}${key}`);
    } catch (error) {
      console.warn('Failed to delete browser cache:', error);
    }
  }

  public static clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(BrowserCacheService.CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear browser cache:', error);
    }
  }

  public static cleanup(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(BrowserCacheService.CACHE_PREFIX)) {
          const item = localStorage.getItem(key);
          if (item) {
            try {
              const parsed = JSON.parse(item);
              if (Date.now() - parsed.timestamp > parsed.ttl) {
                localStorage.removeItem(key);
              }
            } catch (error) {
              localStorage.removeItem(key);
            }
          }
        }
      });
    } catch (error) {
      console.warn('Failed to cleanup browser cache:', error);
    }
  }
}
