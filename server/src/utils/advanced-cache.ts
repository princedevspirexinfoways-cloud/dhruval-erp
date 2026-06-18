import { logger } from './logger';
import { performance } from 'perf_hooks';
import { simpleCache } from './simple-cache';

// Optional dependencies - only if available
let Redis: any = null;
let LRU: any = null;

try {
  Redis = require('ioredis');
} catch (error) {
  logger.info('📦 Redis not installed - using fallback cache');
}

try {
  LRU = require('lru-cache');
  logger.info('📦 LRU-cache loaded successfully');
} catch (error) {
  logger.info('📦 LRU-cache not installed - using simple cache fallback');
}

/**
 * Advanced Multi-Level Caching System
 * L1: In-Memory LRU Cache (fastest)
 * L2: Redis Cache (shared across instances)
 * L3: Database (fallback)
 */

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  compress?: boolean; // Enable compression
  tags?: string[]; // Cache tags for invalidation
  namespace?: string; // Cache namespace
}

export interface CacheStats {
  l1Hits: number;
  l1Misses: number;
  l2Hits: number;
  l2Misses: number;
  totalRequests: number;
  hitRate: number;
  avgResponseTime: number;
}

class AdvancedCacheManager {
  private redis: any = null;
  private l1Cache: any = null;
  private stats: CacheStats;
  private compressionEnabled: boolean = true;
  private redisAvailable: boolean = false;
  private useSimpleCache: boolean = false;

  constructor() {
    // Initialize L1 Cache: Try LRU, fallback to simple cache
    if (LRU) {
      try {
        this.l1Cache = new LRU({
          max: 10000, // Maximum 10k items
          ttl: 1000 * 60 * 5, // 5 minutes TTL
          updateAgeOnGet: true,
          allowStale: false
        });
        logger.info('📦 Advanced LRU cache initialized successfully');
      } catch (error) {
        logger.warn('⚠️ LRU cache initialization failed, using simple cache:', error);
        this.useSimpleCache = true;
        logger.info('📦 Using simple cache fallback (no external dependencies)');
      }
    } else {
      this.useSimpleCache = true;
      logger.info('📦 Using simple cache fallback (no external dependencies)');
    }

    // Initialize stats
    this.stats = {
      l1Hits: 0,
      l1Misses: 0,
      l2Hits: 0,
      l2Misses: 0,
      totalRequests: 0,
      hitRate: 0,
      avgResponseTime: 0
    };

    // Initialize Redis asynchronously to avoid blocking
    setImmediate(() => {
      this.initializeRedis().catch(error => {
        logger.warn('Redis initialization failed, continuing with in-memory cache only:', error);
      });
    });
  }

  /**
   * Initialize Redis connection (optional)
   */
  private async initializeRedis(): Promise<void> {
    // Skip Redis initialization if not available
    if (!Redis) {
      logger.info('📦 Redis package not available - using in-memory cache only');
      this.redisAvailable = false;
      return;
    }

    // Skip Redis if explicitly disabled or in development
    if (process.env.DISABLE_REDIS === 'true' || process.env.NODE_ENV === 'development') {
      logger.info('🚫 Redis disabled for development - using in-memory cache only');
      this.redisAvailable = false;
      return;
    }

    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      this.redis = new Redis(redisUrl, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 1, // Reduced retries
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 3000, // Reduced timeout
        commandTimeout: 2000, // Reduced timeout
        // Connection pooling
        family: 4,
        db: 0,
        enableReadyCheck: false // Disable ready check to prevent hanging
      });

      this.redis.on('connect', () => {
        logger.info('✅ Redis connected successfully');
        this.redisAvailable = true;
      });

      this.redis.on('error', (error) => {
        logger.warn('⚠️ Redis connection error, falling back to in-memory cache');
        this.redis = null;
        this.redisAvailable = false;
      });

      this.redis.on('ready', () => {
        logger.info('🚀 Redis ready for operations');
        this.redisAvailable = true;
      });

      // Test connection with short timeout - don't block startup
      const connectionTest = Promise.race([
        this.redis.ping(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Redis connection timeout')), 2000)
        )
      ]);

      await connectionTest;
      this.redisAvailable = true;
      logger.info('✅ Redis connection test successful');

    } catch (error) {
      logger.info('📦 Redis not available, using in-memory cache only. This is perfectly fine for development!');
      this.redis = null;
      this.redisAvailable = false;
    }
  }

  /**
   * Get value from cache with multi-level fallback
   */
  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const startTime = performance.now();
    this.stats.totalRequests++;

    try {
      const fullKey = this.buildKey(key, options.namespace);

      // L1 Cache check
      let l1Value: any = undefined;

      if (this.useSimpleCache) {
        l1Value = await simpleCache.get(fullKey, options);
      } else if (this.l1Cache) {
        l1Value = this.l1Cache.get(fullKey);
      }

      if (l1Value !== undefined && l1Value !== null) {
        this.stats.l1Hits++;
        this.updateStats(startTime);
        logger.debug('🎯 L1 Cache HIT', { key: fullKey });
        return this.useSimpleCache ? l1Value : this.deserialize(l1Value);
      }

      this.stats.l1Misses++;

      // L2 Cache check (Redis) - only if available
      if (this.redis && this.redisAvailable) {
        try {
          const l2Value = await this.redis.get(fullKey);
          if (l2Value !== null) {
            this.stats.l2Hits++;

            // Store in L1 for faster access
            const deserializedValue = this.deserialize(l2Value);

            if (this.useSimpleCache) {
              await simpleCache.set(fullKey, deserializedValue, options);
            } else if (this.l1Cache) {
              this.l1Cache.set(fullKey, l2Value, { ttl: (options.ttl || 300) * 1000 });
            }

            this.updateStats(startTime);
            logger.debug('🎯 L2 Cache HIT', { key: fullKey });
            return deserializedValue;
          }
        } catch (error) {
          logger.warn('Redis get error, falling back to L1 cache:', error);
          this.redisAvailable = false;
        }
      }

      this.stats.l2Misses++;
      this.updateStats(startTime);
      logger.debug('❌ Cache MISS', { key: fullKey });
      return null;

    } catch (error) {
      logger.error('Cache get error:', error);
      this.updateStats(startTime);
      return null;
    }
  }

  /**
   * Set value in cache with multi-level storage
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    try {
      const fullKey = this.buildKey(key, options.namespace);
      const serializedValue = this.serialize(value, options.compress);
      const ttl = options.ttl || 300; // Default 5 minutes

      // Store in L1 Cache
      if (this.useSimpleCache) {
        await simpleCache.set(fullKey, value, options);
      } else if (this.l1Cache) {
        this.l1Cache.set(fullKey, serializedValue, { ttl: ttl * 1000 });
      }

      // Store in L2 Cache (Redis) - only if available
      if (this.redis && this.redisAvailable) {
        try {
          await this.redis.setex(fullKey, ttl, serializedValue);

          // Add tags for invalidation
          if (options.tags && options.tags.length > 0) {
            await this.addTags(fullKey, options.tags);
          }
        } catch (error) {
          logger.warn('Redis set error, continuing with L1 cache only:', error);
          this.redisAvailable = false;
        }
      }

      logger.debug('💾 Cache SET', { key: fullKey, ttl, tags: options.tags });

    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }

  /**
   * Delete from cache
   */
  async del(key: string, namespace?: string): Promise<void> {
    try {
      const fullKey = this.buildKey(key, namespace);

      // Delete from L1
      if (this.useSimpleCache) {
        await simpleCache.del(fullKey, namespace);
      } else if (this.l1Cache) {
        this.l1Cache.delete(fullKey);
      }

      // Delete from L2 (Redis) - only if available
      if (this.redis && this.redisAvailable) {
        try {
          await this.redis.del(fullKey);
        } catch (error) {
          logger.warn('Redis delete error:', error);
        }
      }

      logger.debug('🗑️ Cache DELETE', { key: fullKey });

    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    // If Redis is not available, use fallback cache invalidation
    if (!this.redis || !this.redisAvailable) {
      logger.info('🏷️ Redis not available, using fallback cache invalidation');

      if (this.useSimpleCache) {
        await simpleCache.invalidateByTags(tags);
      } else if (this.l1Cache) {
        // Clear L1 cache entries that match tag patterns
        for (const tag of tags) {
          const keysToDelete: string[] = [];
          for (const [key] of this.l1Cache.entries()) {
            if (key.includes(tag)) {
              keysToDelete.push(key);
            }
          }
          keysToDelete.forEach((key: string) => this.l1Cache.delete(key));
          logger.info('🏷️ L1 Cache cleared by tag pattern', { tag, keysCount: keysToDelete.length });
        }
      }
      return;
    }

    try {
      for (const tag of tags) {
        const tagKey = `tag:${tag}`;
        const keys = await this.redis.smembers(tagKey);

        if (keys.length > 0) {
          // Delete from L1
          if (this.useSimpleCache) {
            // Simple cache handles its own tag invalidation
          } else if (this.l1Cache) {
            keys.forEach((key: string) => this.l1Cache.delete(key));
          }

          // Delete from L2
          await this.redis.del(...keys);

          // Clean up tag
          await this.redis.del(tagKey);

          logger.info('🏷️ Cache invalidated by tag', { tag, keysCount: keys.length });
        }
      }
    } catch (error) {
      logger.warn('Cache tag invalidation error, falling back to L1 only:', error);
      this.redisAvailable = false;
    }
  }

  /**
   * Cache warming - preload frequently accessed data
   */
  async warmCache(warmingData: Array<{ key: string; value: any; options?: CacheOptions }>): Promise<void> {
    logger.info('🔥 Starting cache warming...', { itemsCount: warmingData.length });

    const promises = warmingData.map(async ({ key, value, options }) => {
      try {
        await this.set(key, value, options);
      } catch (error) {
        logger.error('Cache warming error for key:', key, error);
      }
    });

    await Promise.allSettled(promises);
    logger.info('✅ Cache warming completed');
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalHits = this.stats.l1Hits + this.stats.l2Hits;
    const hitRate = this.stats.totalRequests > 0 ? (totalHits / this.stats.totalRequests) * 100 : 0;

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100
    };
  }

  /**
   * Clear all caches
   */
  async clear(): Promise<void> {
    try {
      // Clear L1
      if (this.useSimpleCache) {
        await simpleCache.clear();
      } else if (this.l1Cache) {
        this.l1Cache.clear();
      }

      // Clear L2 (Redis) - only if available
      if (this.redis && this.redisAvailable) {
        try {
          await this.redis.flushdb();
        } catch (error) {
          logger.warn('Redis clear error:', error);
        }
      }

      // Reset stats
      this.stats = {
        l1Hits: 0,
        l1Misses: 0,
        l2Hits: 0,
        l2Misses: 0,
        totalRequests: 0,
        hitRate: 0,
        avgResponseTime: 0
      };

      logger.info('🧹 All caches cleared');

    } catch (error) {
      logger.error('Cache clear error:', error);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ l1: boolean; l2: boolean; redisAvailable: boolean; stats: CacheStats }> {
    const l1Health = this.l1Cache.size >= 0; // L1 is always available
    let l2Health = false;

    if (this.redis && this.redisAvailable) {
      try {
        await this.redis.ping();
        l2Health = true;
      } catch (error) {
        l2Health = false;
        this.redisAvailable = false;
      }
    }

    return {
      l1: l1Health,
      l2: l2Health,
      redisAvailable: this.redisAvailable,
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
   * Serialize value with optional compression
   */
  private serialize(value: any, compress: boolean = false): string {
    try {
      const jsonString = JSON.stringify(value);

      if (compress && this.compressionEnabled && jsonString.length > 1024) {
        // For large objects, we could implement compression here
        // For now, just return JSON string
        return jsonString;
      }

      return jsonString;
    } catch (error) {
      logger.error('Serialization error:', error);
      return '{}';
    }
  }

  /**
   * Deserialize value
   */
  private deserialize(value: string): any {
    try {
      return JSON.parse(value);
    } catch (error) {
      logger.error('Deserialization error:', error);
      return null;
    }
  }

  /**
   * Add tags for cache invalidation
   */
  private async addTags(key: string, tags: string[]): Promise<void> {
    if (!this.redis || !this.redisAvailable) return;

    try {
      const promises = tags.map(tag =>
        this.redis!.sadd(`tag:${tag}`, key)
      );
      await Promise.all(promises);
    } catch (error) {
      logger.warn('Add tags error:', error);
      this.redisAvailable = false;
    }
  }

  /**
   * Update performance stats
   */
  private updateStats(startTime: number): void {
    const responseTime = performance.now() - startTime;
    this.stats.avgResponseTime = (this.stats.avgResponseTime + responseTime) / 2;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.redis && this.redisAvailable) {
      try {
        await this.redis.quit();
      } catch (error) {
        logger.warn('Redis cleanup error:', error);
      }
    }
    if (this.useSimpleCache) {
      await simpleCache.clear();
    } else if (this.l1Cache) {
      this.l1Cache.clear();
    }
    this.redisAvailable = false;
  }
}

// Singleton instance
export const advancedCache = new AdvancedCacheManager();

// Cache decorator for methods
export function cacheResult(options: CacheOptions = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${target.constructor.name}.${propertyName}:${JSON.stringify(args)}`;

      // Try to get from cache
      const cached = await advancedCache.get(cacheKey, options);
      if (cached !== null) {
        return cached;
      }

      // Execute method and cache result
      const result = await method.apply(this, args);
      await advancedCache.set(cacheKey, result, options);

      return result;
    };

    return descriptor;
  };
}

export default advancedCache;
