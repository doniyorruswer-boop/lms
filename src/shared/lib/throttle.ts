/**
 * Throttling utility.
 *
 * Wraps a function so that its actual invocations are spaced at least
 * `intervalMs` apart in time. This is the basis for periodic side effects
 * such as sending video progress every 10s (Requirement 4.3) and running
 * face-api proctoring checks every 10s (Requirement 8.3).
 *
 * Behaviour (leading + trailing edge):
 * - The first call invokes `fn` immediately.
 * - Calls that arrive while the interval window is still open are coalesced;
 *   the most recent arguments are remembered and `fn` is invoked once when the
 *   window elapses (trailing edge).
 * - Consecutive invocations of `fn` are therefore guaranteed to be at least
 *   `intervalMs` apart: `∀ i: callTime[i+1] - callTime[i] >= intervalMs`
 *   (design Property 9).
 *
 * Time is read via `Date.now()` and scheduling uses `setTimeout`, so the
 * behaviour is compatible with fake timers in tests.
 */
export interface Throttled<A extends unknown[]> {
  (...args: A): void
  /** Cancel any pending trailing invocation and reset the interval window. */
  cancel: () => void
}

export function throttle<A extends unknown[]>(
  fn: (...args: A) => void,
  intervalMs: number,
): Throttled<A> {
  let lastInvokeTime: number | null = null
  let timer: ReturnType<typeof setTimeout> | null = null
  let pendingArgs: A | null = null

  const invoke = (args: A): void => {
    lastInvokeTime = Date.now()
    fn(...args)
  }

  const throttled = (...args: A): void => {
    const now = Date.now()

    // First ever call, or the interval window has fully elapsed: fire now.
    if (lastInvokeTime === null || now - lastInvokeTime >= intervalMs) {
      // If a trailing call was queued, the immediate invocation supersedes it.
      if (timer !== null) {
        clearTimeout(timer)
        timer = null
        pendingArgs = null
      }
      invoke(args)
      return
    }

    // Inside the window: remember the latest args and schedule a trailing call
    // for the moment the window elapses (if one is not already scheduled).
    pendingArgs = args
    if (timer === null) {
      const remaining = intervalMs - (now - lastInvokeTime)
      timer = setTimeout(() => {
        timer = null
        const queued = pendingArgs as A
        pendingArgs = null
        invoke(queued)
      }, remaining)
    }
  }

  throttled.cancel = (): void => {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
    pendingArgs = null
    lastInvokeTime = null
  }

  return throttled
}
