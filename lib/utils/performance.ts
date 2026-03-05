/**
 * Performance utilities for search, filters, and real-time updates.
 */

/**
 * Debounce — delays invoking `fn` until `ms` milliseconds have elapsed
 * since the last call. Useful for search inputs and resize handlers.
 */
export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  ms: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, ms);
  };
}

/**
 * Throttle — ensures `fn` is called at most once every `ms` milliseconds.
 * Uses a leading-edge call with trailing execution of the latest args.
 * Useful for scroll handlers and real-time updates.
 */
export function throttle<T extends (...args: never[]) => void>(
  fn: T,
  ms: number,
): (...args: Parameters<T>) => void {
  let lastCallTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let latestArgs: Parameters<T> | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const elapsed = now - lastCallTime;

    if (elapsed >= ms) {
      // Enough time has passed — call immediately
      lastCallTime = now;
      fn(...args);
    } else {
      // Schedule a trailing call with the latest arguments
      latestArgs = args;
      if (timeoutId === null) {
        timeoutId = setTimeout(() => {
          lastCallTime = Date.now();
          timeoutId = null;
          if (latestArgs !== null) {
            fn(...latestArgs);
            latestArgs = null;
          }
        }, ms - elapsed);
      }
    }
  };
}

/**
 * Memoize — caches the result of an expensive single-argument function.
 * Uses a Map for O(1) lookups with automatic caching.
 *
 * For functions with complex arguments, provide a custom `keyFn`
 * to derive a stable cache key.
 */
export function memoize<TArg, TResult>(
  fn: (arg: TArg) => TResult,
  keyFn?: (arg: TArg) => string,
): (arg: TArg) => TResult {
  const cache = new Map<string | TArg, TResult>();

  return (arg: TArg): TResult => {
    const key = keyFn ? keyFn(arg) : arg;

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(arg);
    cache.set(key, result);
    return result;
  };
}
