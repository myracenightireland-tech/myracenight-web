// A tiny interval poller used as the REST fallback when the socket can't
// connect. Kept framework-free so it can be unit-tested with fake timers.

export interface Poller {
  /** Start polling. Runs `fn` immediately, then every `intervalMs`. */
  start: () => void;
  /** Stop polling and prevent any queued run. */
  stop: () => void;
  /** Whether the poller is currently active. */
  isRunning: () => boolean;
}

export interface PollerOptions {
  /** Run `fn` once immediately on start (default true). */
  immediate?: boolean;
}

/**
 * Create a poller that calls `fn` on an interval. Overlapping runs are
 * prevented: if a previous `fn` is still in flight, the tick is skipped.
 */
export function createPoller(
  fn: () => void | Promise<void>,
  intervalMs: number,
  options: PollerOptions = {}
): Poller {
  const { immediate = true } = options;
  let timer: ReturnType<typeof setInterval> | null = null;
  let inFlight = false;

  const run = async () => {
    if (inFlight) return;
    inFlight = true;
    try {
      await fn();
    } catch {
      // Swallow — a failed poll should not kill the interval; we retry next tick.
    } finally {
      inFlight = false;
    }
  };

  return {
    start() {
      if (timer !== null) return;
      timer = setInterval(run, intervalMs);
      if (immediate) void run();
    },
    stop() {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    },
    isRunning() {
      return timer !== null;
    },
  };
}
