/**
 * Two-tier caching layer for translated journeys
 *
 * Uses Redis when available, falls back to in-memory LRU cache
 */

import { env } from "@typebot.io/env";
import type { Redis } from "ioredis";

const DEFAULT_TTL_SECONDS = 3600; // 1 hour
const MAX_MEMORY_CACHE_SIZE = 100;

// In-memory LRU cache implementation
class LRUCache<T> {
  private cache: Map<string, { value: T; expiry: number }> = new Map();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, item);
    return item.value;
  }

  set(key: string, value: T, ttlSeconds: number): void {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttlSeconds * 1000,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  deleteByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

// Singleton instances
let redisClient: Redis | null = null;
const memoryCache = new LRUCache<object>(MAX_MEMORY_CACHE_SIZE);

/**
 * Get the cache key for a translated journey
 */
export const getCacheKey = (botId: string, language: string): string => {
  return `i18n:${botId}:${language}`;
};

/**
 * Initialize Redis client if configured
 */
const getRedisClient = async (): Promise<Redis | null> => {
  if (redisClient) return redisClient;

  if (!env.REDIS_URL) return null;

  try {
    const { default: Redis } = await import("ioredis");
    redisClient = new Redis(env.REDIS_URL);
    return redisClient;
  } catch (error) {
    console.warn("Failed to initialize Redis for i18n cache:", error);
    return null;
  }
};

/**
 * Get a translated journey from cache
 */
export const getFromCache = async <T = object>(
  botId: string,
  language: string
): Promise<T | null> => {
  const key = getCacheKey(botId, language);

  // Try Redis first
  const redis = await getRedisClient();
  if (redis) {
    try {
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached) as T;
      }
    } catch (error) {
      console.warn("Redis cache get error:", error);
    }
  }

  // Fall back to memory cache
  return memoryCache.get(key) as T | null;
};

/**
 * Set a translated journey in cache
 */
export const setInCache = async (
  botId: string,
  language: string,
  journey: object,
  ttlSeconds: number = DEFAULT_TTL_SECONDS
): Promise<void> => {
  const key = getCacheKey(botId, language);

  // Try Redis first
  const redis = await getRedisClient();
  if (redis) {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(journey));
    } catch (error) {
      console.warn("Redis cache set error:", error);
    }
  }

  // Always set in memory cache as fallback
  memoryCache.set(key, journey, ttlSeconds);
};

/**
 * Invalidate cache for a specific translation
 */
export const invalidateCache = async (
  botId: string,
  language: string
): Promise<void> => {
  const key = getCacheKey(botId, language);

  // Try Redis
  const redis = await getRedisClient();
  if (redis) {
    try {
      await redis.del(key);
    } catch (error) {
      console.warn("Redis cache delete error:", error);
    }
  }

  // Memory cache
  memoryCache.delete(key);
};

/**
 * Invalidate all cached translations for a bot
 */
export const invalidateAllCacheForBot = async (
  botId: string
): Promise<void> => {
  const prefix = `i18n:${botId}:`;

  // Try Redis
  const redis = await getRedisClient();
  if (redis) {
    try {
      const keys = await redis.keys(`${prefix}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.warn("Redis cache bulk delete error:", error);
    }
  }

  // Memory cache
  memoryCache.deleteByPrefix(prefix);
};

/**
 * Clear entire cache (for testing/admin purposes)
 */
export const clearAllCache = async (): Promise<void> => {
  // Try Redis
  const redis = await getRedisClient();
  if (redis) {
    try {
      const keys = await redis.keys("i18n:*");
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.warn("Redis cache clear error:", error);
    }
  }

  // Memory cache
  memoryCache.clear();
};
