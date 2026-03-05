/**
 * rate-limit.ts — Simple in-memory rate limiting.
 *
 * Provides a sliding-window rate limiter for use in API routes
 * and server-side logic. For serverless environments where
 * in-memory state is ephemeral, prefer the Convex-based rate
 * limiter in convex/rateLimits.ts instead.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface RateLimitConfig {
  /** Maximum number of requests allowed within the window. */
  maxRequests: number;
  /** Time window in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  /** Whether the request is allowed. */
  allowed: boolean;
  /** Number of requests remaining in the current window. */
  remainingRequests: number;
  /** Timestamp (ms) when the current window resets. */
  resetAt: number;
}

// ─── RateLimiter class ──────────────────────────────────────────────────────

interface WindowEntry {
  timestamps: number[];
}

/**
 * In-memory sliding-window rate limiter.
 *
 * Each unique key (e.g., user ID, IP address) tracks request timestamps.
 * Old timestamps outside the window are pruned on each check.
 *
 * Note: This is non-blocking by design. When a rate limit is exceeded,
 * it returns `{ allowed: false }` instead of throwing, so callers can
 * decide how to respond (return 429, log a warning, queue the request, etc.).
 */
export class RateLimiter {
  private config: RateLimitConfig;
  private windows: Map<string, WindowEntry>;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.windows = new Map();

    // Periodically clean up stale entries to prevent memory leaks.
    // Runs every 60 seconds.
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);

    // Allow the Node.js process to exit even if the interval is running.
    if (this.cleanupInterval && typeof this.cleanupInterval === "object" && "unref" in this.cleanupInterval) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Check whether a request is allowed for the given key.
   * If allowed, the request is recorded. If not, remaining info is returned.
   */
  checkRateLimit(key: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    let entry = this.windows.get(key);

    if (!entry) {
      entry = { timestamps: [] };
      this.windows.set(key, entry);
    }

    // Prune timestamps outside the current window
    entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

    const resetAt = entry.timestamps.length > 0
      ? entry.timestamps[0] + this.config.windowMs
      : now + this.config.windowMs;

    if (entry.timestamps.length >= this.config.maxRequests) {
      return {
        allowed: false,
        remainingRequests: 0,
        resetAt,
      };
    }

    // Record this request
    entry.timestamps.push(now);

    return {
      allowed: true,
      remainingRequests: this.config.maxRequests - entry.timestamps.length,
      resetAt,
    };
  }

  /**
   * Check remaining requests without consuming one.
   */
  peek(key: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    const entry = this.windows.get(key);
    if (!entry) {
      return {
        allowed: true,
        remainingRequests: this.config.maxRequests,
        resetAt: now + this.config.windowMs,
      };
    }

    const active = entry.timestamps.filter((t) => t > windowStart);
    const resetAt = active.length > 0
      ? active[0] + this.config.windowMs
      : now + this.config.windowMs;

    return {
      allowed: active.length < this.config.maxRequests,
      remainingRequests: Math.max(0, this.config.maxRequests - active.length),
      resetAt,
    };
  }

  /**
   * Remove stale entries that have no timestamps within the current window.
   */
  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    for (const [key, entry] of this.windows.entries()) {
      entry.timestamps = entry.timestamps.filter((t) => t > windowStart);
      if (entry.timestamps.length === 0) {
        this.windows.delete(key);
      }
    }
  }

  /**
   * Destroy the rate limiter and clear the cleanup interval.
   * Call this when the rate limiter is no longer needed.
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.windows.clear();
  }

  /**
   * Reset the rate limit state for a specific key.
   */
  reset(key: string): void {
    this.windows.delete(key);
  }
}

// ─── Preset rate limit configs ──────────────────────────────────────────────

/**
 * Pre-configured rate limits for different API endpoints.
 * Each creates a separate RateLimiter instance so limits
 * are tracked independently.
 */
export const API_RATE_LIMITS = {
  /** Publishing: 10 requests per minute */
  publishing: new RateLimiter({
    maxRequests: 10,
    windowMs: 60_000,
  }),

  /** AI generation: 20 requests per minute */
  ai: new RateLimiter({
    maxRequests: 20,
    windowMs: 60_000,
  }),

  /** OAuth flows: 5 requests per minute */
  oauth: new RateLimiter({
    maxRequests: 5,
    windowMs: 60_000,
  }),
} as const;
