import { logger } from './logger';

/**
 * Simple in-memory cache system (no external dependencies)
 * Perfect fallback when Redis is not available
 */

export interface SimpleCacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
  namespace?: string; // Cache namespace
}

export interface SimpleCacheStats {
  hits: number;
  misses: number;
  totalRequests: number;
  hitRate: number;
  size: number;
  maxSize: number;
}

interface CacheEntry {
  value: any;
  expiry: number;
  tags: string[];
  createdAt: number;
}

class SimpleCacheManager {
  private cache = new Map<string, CacheEntry>();
  private tagMap = new Map<string, Set<string>>(); // tag -> keys mapping
  private maxSize: number = 10000;
  private stats: SimpleCacheStats;
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.stats = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      hitRate: 0,
      size: 0,
      maxSize: this.maxSize
    };

    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 5 * 60 * 1000);

    logger.info('📦 Simple Cache Manager initialized (no Redis required)');
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string, options: SimpleCacheOptions = {}): Promise<T | null> {
    this.stats.totalRequests++;
    
    const fullKey = this.buildKey(key, options.namespace);
    const entry = this.cache.get(fullKey);

    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(fullKey);
      this.removeTags(fullKey, entry.tags);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    this.stats.hits++;
    this.updateHitRate();
    logger.debug('🎯 Cache HIT', { key: fullKey });
    
    return entry.value as T;
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options: SimpleCacheOptions = {}): Promise<void> {
    const fullKey = this.buildKey(key, options.namespace);
    const ttl = (options.ttl || 300) * 1000; // Convert to milliseconds
    const expiry = Date.now() + ttl;
    const tags = options.tags || [];

    // Check if we need to make space
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    // Create cache entry
    const entry: CacheEntry = {
      value,
      expiry,
      tags,
      createdAt: Date.now()
    };

    this.cache.set(fullKey, entry);
    this.addTags(fullKey, tags);
    this.stats.size = this.cache.size;

    logger.debug('💾 Cache SET', { key: fullKey, ttl: options.ttl, tags });
  }

  /**
   * Delete from cache
   */
  async del(key: string, namespace?: string): Promise<void> {
    const fullKey = this.buildKey(key, namespace);
    const entry = this.cache.get(fullKey);
    
    if (entry) {
      this.cache.delete(fullKey);
      this.removeTags(fullKey, entry.tags);
      this.stats.size = this.cache.size;
      logger.debug('🗑️ Cache DELETE', { key: fullKey });
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    let totalKeysDeleted = 0;

    for (const tag of tags) {
      const keys = this.tagMap.get(tag);
      if (keys) {
        for (const key of keys) {
          const entry = this.cache.get(key);
          if (entry) {
            this.cache.delete(key);
            this.removeTags(key, entry.tags);
            totalKeysDeleted++;
          }
        }
        this.tagMap.delete(tag);
      }
    }

    this.stats.size = this.cache.size;
    
    if (totalKeysDeleted > 0) {
      logger.info('🏷️ Cache invalidated by tags', { tags, keysDeleted: totalKeysDeleted });
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.tagMap.clear();
    this.stats.size = 0;
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.stats.totalRequests = 0;
    this.stats.hitRate = 0;
    
    logger.info('🧹 Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): SimpleCacheStats {
    return { ...this.stats };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'degraded'; stats: SimpleCacheStats }> {
    const memoryUsage = process.memoryUsage();
    const isHealthy = this.cache.size < this.maxSize * 0.9 && memoryUsage.heapUsed < 1024 * 1024 * 1024; // 1GB

    return {
      status: isHealthy ? 'healthy' : 'degraded',
      stats: this.getStats()
    };
  }

  /**
   * Build cache key with namespace
   */
  private buildKey(key: string, namespace?: string): string {
    const prefix = process.env.CACHE_PREFIX || 'erp';
    return namespace ? `${prefix}:${namespace}:${key}` : `${prefix}:${key}`;
  }

  /**
   * Add tags for a key
   */
  private addTags(key: string, tags: string[]): void {
    for (const tag of tags) {
      if (!this.tagMap.has(tag)) {
        this.tagMap.set(tag, new Set());
      }
      this.tagMap.get(tag)!.add(key);
    }
  }

  /**
   * Remove tags for a key
   */
  private removeTags(key: string, tags: string[]): void {
    for (const tag of tags) {
      const keys = this.tagMap.get(tag);
      if (keys) {
        keys.delete(key);
        if (keys.size === 0) {
          this.tagMap.delete(tag);
        }
      }
    }
  }

  /**
   * Cleanup expired entries
   */
  private cleanupExpired(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
        this.removeTags(key, entry.tags);
        cleanedCount++;
      }
    }

    this.stats.size = this.cache.size;

    if (cleanedCount > 0) {
      logger.debug('🧹 Cache cleanup completed', { cleanedCount, remainingSize: this.cache.size });
    }
  }

  /**
   * Evict oldest entries when cache is full
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this.cache.get(oldestKey);
      if (entry) {
        this.cache.delete(oldestKey);
        this.removeTags(oldestKey, entry.tags);
        logger.debug('🗑️ Evicted oldest cache entry', { key: oldestKey });
      }
    }
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    if (this.stats.totalRequests > 0) {
      this.stats.hitRate = (this.stats.hits / this.stats.totalRequests) * 100;
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
    this.tagMap.clear();
  }
}

// Export singleton instance
export const simpleCache = new SimpleCacheManager();

// Cache decorator for methods (no Redis required)
export function simpleCacheResult(options: SimpleCacheOptions = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${target.constructor.name}.${propertyName}:${JSON.stringify(args)}`;
      
      // Try to get from cache
      const cached = await simpleCache.get(cacheKey, options);
      if (cached !== null) {
        return cached;
      }

      // Execute method and cache result
      const result = await method.apply(this, args);
      await simpleCache.set(cacheKey, result, options);
      
      return result;
    };

    return descriptor;
  };
}

export default simpleCache;
