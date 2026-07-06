import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPoller } from './poller';

describe('poller — socket-down REST fallback', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('runs immediately then on each interval while running', async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const poller = createPoller(fn, 5000);

    poller.start();
    expect(poller.isRunning()).toBe(true);
    expect(fn).toHaveBeenCalledTimes(1); // immediate

    await vi.advanceTimersByTimeAsync(5000);
    expect(fn).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(10000);
    expect(fn).toHaveBeenCalledTimes(4);
  });

  it('stops polling after stop()', async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const poller = createPoller(fn, 5000);
    poller.start();
    poller.stop();
    expect(poller.isRunning()).toBe(false);
    await vi.advanceTimersByTimeAsync(20000);
    expect(fn).toHaveBeenCalledTimes(1); // only the immediate run before stop
  });

  it('can skip the immediate run', () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const poller = createPoller(fn, 5000, { immediate: false });
    poller.start();
    expect(fn).not.toHaveBeenCalled();
  });

  it('does not overlap runs when fn is slow', async () => {
    let resolve!: () => void;
    const fn = vi.fn(() => new Promise<void>((r) => (resolve = r)));
    const poller = createPoller(fn, 1000);
    poller.start();
    expect(fn).toHaveBeenCalledTimes(1);
    // Several ticks pass while the first run is still in flight.
    await vi.advanceTimersByTimeAsync(3000);
    expect(fn).toHaveBeenCalledTimes(1);
    resolve();
    await vi.advanceTimersByTimeAsync(1000);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('keeps polling even if a run rejects', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('network down'));
    const poller = createPoller(fn, 1000);
    poller.start();
    await vi.advanceTimersByTimeAsync(3000);
    expect(fn.mock.calls.length).toBeGreaterThanOrEqual(3);
    expect(poller.isRunning()).toBe(true);
  });
});
