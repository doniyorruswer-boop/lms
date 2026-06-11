/**
 * A debounced version of a function: the wrapped callback fires only after a
 * quiet period of `delayMs` has elapsed since the most recent invocation.
 * Every new call restarts the timer, so a burst of events collapses into a
 * single trailing call.
 */
export interface Debounced<TArgs extends unknown[]> {
  /** Schedule a call; the underlying function runs after the quiet period. */
  (...args: TArgs): void
  /** Cancel any pending call without invoking the underlying function. */
  cancel(): void
  /** Immediately invoke any pending call (with its latest args) and clear the timer. */
  flush(): void
  /** Whether a call is currently scheduled. */
  pending(): boolean
}

/**
 * Wrap `fn` so it is only called after `delayMs` milliseconds have passed
 * without any further calls. This matches answer autosave (5000 ms) and
 * report filter reloads (1000 ms).
 *
 * @param fn - The function to debounce.
 * @param delayMs - Quiet period in milliseconds. Negative values are treated as 0.
 */
export function debounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  delayMs: number,
): Debounced<TArgs> {
  const delay = delayMs > 0 ? delayMs : 0
  let timer: ReturnType<typeof setTimeout> | null = null
  let lastArgs: TArgs | null = null

  const invoke = (): void => {
    const args = lastArgs as TArgs
    timer = null
    lastArgs = null
    fn(...args)
  }

  const debounced = ((...args: TArgs): void => {
    lastArgs = args
    if (timer !== null) {
      clearTimeout(timer)
    }
    timer = setTimeout(invoke, delay)
  }) as Debounced<TArgs>

  debounced.cancel = (): void => {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
    lastArgs = null
  }

  debounced.flush = (): void => {
    if (timer !== null) {
      clearTimeout(timer)
      invoke()
    }
  }

  debounced.pending = (): boolean => timer !== null

  return debounced
}
