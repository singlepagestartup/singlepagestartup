import { REACT_QUERY_MAX_CONCURRENT_QUERIES } from "@sps/shared-utils";

/**
 * The `RequestLimiter` class is designed to manage the number of simultaneous requests
 * in the application. It implements a semaphore-like mechanism to limit concurrent calls,
 * allowing requests to be added to a queue if the maximum active request limit is reached.
 *
 * This is useful for preventing server overload or avoiding API rate limits caused by
 * too many simultaneous requests.
 *
 * Key features:
 * - Set the maximum number of concurrent requests.
 * - Add new requests to a queue when the limit is exceeded.
 * - Execute requests on a "first in, first out" (FIFO) basis.
 *
 * Example usage:
 *
 * ```ts
 * const requestLimiter = new RequestLimiter(3); // Maximum of 3 simultaneous requests
 *
 * async function fetchData() {
 *   await requestLimiter.run(async () => {
 *     const response = await fetch("https://example.com/api");
 *     const data = await response.json();
 *     console.log(data);
 *   });
 * }
 * ```
 *
 * In this example, `fetchData` will run a maximum of 3 times concurrently.
 * The remaining calls will wait for their turn.
 *
 * This is particularly useful for:
 * - Working with rate-limited external APIs (e.g., limited requests per second).
 * - Preventing UI overload with too many concurrent network requests.
 * - Ensuring even distribution of requests under high user load.
 */
export class RequestLimiter {
  private maxConcurrentRequests: number;
  private currentRequests: number = 0;
  private queue: (() => void)[] = [];

  /**
   * Creates an instance of the request limiter.
   * @param maxConcurrentRequests The maximum number of concurrent requests.
   */
  constructor(maxConcurrentRequests: number) {
    this.maxConcurrentRequests = maxConcurrentRequests;
  }

  /**
   * Executes an asynchronous function while respecting the request limit.
   * If the limit is exceeded, the function is added to the queue and will be executed
   * when a slot becomes available.
   *
   * @param fn The asynchronous function to execute.
   * @returns A promise with the result of the function execution.
   */
  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.currentRequests >= this.maxConcurrentRequests) {
      await new Promise<void>((resolve) => {
        this.queue.push(resolve);
      });
    }

    this.currentRequests++;
    try {
      return await fn();
    } finally {
      this.currentRequests--;
      if (this.queue.length > 0) {
        const nextResolve = this.queue.shift();
        nextResolve?.();
      }
    }
  }
}

export const requestLimiter = new RequestLimiter(
  REACT_QUERY_MAX_CONCURRENT_QUERIES,
);
