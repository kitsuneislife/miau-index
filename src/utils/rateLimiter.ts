import { RateLimitError } from './errors';

/**
 * Rate limiter configuration
 */
export interface RateLimiterOptions {
  maxRequests: number; // Maximum requests allowed
  windowMs: number; // Time window in milliseconds
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

interface RequestRecord {
  timestamp: number;
  success: boolean;
}

/**
 * Token bucket rate limiter implementation
 */
export class RateLimiter {
  private requests: Map<string, RequestRecord[]> = new Map();
  private options: Required<RateLimiterOptions>;

  constructor(options: RateLimiterOptions) {
    this.options = {
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...options,
    };

    // Start cleanup interval
    this.startCleanup();
  }

  /**
   * Check if a request should be allowed
   */
  async checkLimit(key: string = 'default'): Promise<void> {
    this.cleanup(key);

    const records = this.requests.get(key) || [];
    const now = Date.now();
    const windowStart = now - this.options.windowMs;

    // Count requests in current window
    const recentRequests = records.filter((r) => r.timestamp > windowStart);

    if (recentRequests.length >= this.options.maxRequests) {
      const oldestRequest = recentRequests[0];
      const retryAfter = Math.ceil((oldestRequest.timestamp + this.options.windowMs - now) / 1000);
      throw new RateLimitError(retryAfter);
    }
  }

  /**
   * Record a request
   */
  recordRequest(key: string = 'default', success: boolean = true): void {
    // Skip recording based on options
    if (
      (success && this.options.skipSuccessfulRequests) ||
      (!success && this.options.skipFailedRequests)
    ) {
      return;
    }

    const records = this.requests.get(key) || [];
    records.push({
      timestamp: Date.now(),
      success,
    });

    this.requests.set(key, records);
  }

  /**
   * Execute a function with rate limiting
   */
  async execute<T>(key: string, fn: () => Promise<T>): Promise<T> {
    await this.checkLimit(key);

    try {
      const result = await fn();
      this.recordRequest(key, true);
      return result;
    } catch (error) {
      this.recordRequest(key, false);
      throw error;
    }
  }

  /**
   * Clean up old records for a specific key
   */
  private cleanup(key: string): void {
    const records = this.requests.get(key);
    if (!records) return;

    const now = Date.now();
    const windowStart = now - this.options.windowMs;

    const recentRequests = records.filter((r) => r.timestamp > windowStart);
    this.requests.set(key, recentRequests);
  }

  /**
   * Start periodic cleanup
   */
  private startCleanup(): void {
    const interval = setInterval(() => {
      const now = Date.now();
      const windowStart = now - this.options.windowMs;

      for (const [key, records] of this.requests.entries()) {
        const recentRequests = records.filter((r) => r.timestamp > windowStart);
        if (recentRequests.length === 0) {
          this.requests.delete(key);
        } else {
          this.requests.set(key, recentRequests);
        }
      }
    }, this.options.windowMs);
    
    // Prevent interval from keeping process alive
    interval.unref();
  }

  /**
   * Get current usage for a key
   */
  getUsage(key: string = 'default'): {
    current: number;
    limit: number;
    remaining: number;
    resetAt: number;
  } {
    this.cleanup(key);

    const records = this.requests.get(key) || [];
    const now = Date.now();
    const windowStart = now - this.options.windowMs;

    const recentRequests = records.filter((r) => r.timestamp > windowStart);
    const oldest = recentRequests[0];
    const resetAt = oldest ? oldest.timestamp + this.options.windowMs : now + this.options.windowMs;

    return {
      current: recentRequests.length,
      limit: this.options.maxRequests,
      remaining: Math.max(0, this.options.maxRequests - recentRequests.length),
      resetAt,
    };
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string = 'default'): void {
    this.requests.delete(key);
  }

  /**
   * Clear all rate limit data
   */
  clear(): void {
    this.requests.clear();
  }

  /**
   * Create strict rate limiter (30 requests per minute)
   */
  static strict(): RateLimiter {
    return new RateLimiter({
      maxRequests: 30,
      windowMs: 60000,
    });
  }

  /**
   * Create moderate rate limiter (60 requests per minute)
   */
  static moderate(): RateLimiter {
    return new RateLimiter({
      maxRequests: 60,
      windowMs: 60000,
    });
  }

  /**
   * Create lenient rate limiter (120 requests per minute)
   */
  static lenient(): RateLimiter {
    return new RateLimiter({
      maxRequests: 120,
      windowMs: 60000,
    });
  }
}

/**
 * Create a rate limiter with common presets
 */
export function createRateLimiter(preset: 'strict' | 'moderate' | 'lenient'): RateLimiter {
  const presets: Record<string, RateLimiterOptions> = {
    strict: {
      maxRequests: 30,
      windowMs: 60000, // 30 requests per minute
    },
    moderate: {
      maxRequests: 60,
      windowMs: 60000, // 60 requests per minute
    },
    lenient: {
      maxRequests: 120,
      windowMs: 60000, // 120 requests per minute
    },
  };

  return new RateLimiter(presets[preset]);
}
