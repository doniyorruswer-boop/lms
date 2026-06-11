/**
 * Property-based tests for the debounce utility, driven by fake timers.
 *
 * **Property 14: Debounce invariant (umumiy)**
 * For any event stream, the `debounce(fn, delayMs)`-wrapped function is called
 * only after a quiet period of `delayMs` following the last event; i.e. every
 * invocation must have had no event in the preceding `delayMs`. This holds for
 * answer autosave (5000 ms) and reports filter (1000 ms) alike.
 *
 * **Validates: Requirements 7.4, 17.3**
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fc from 'fast-check'

import { debounce } from './debounce'

/** Real delays used in the product: reports filter (1000) and autosave (5000). */
const REAL_DELAYS = [1000, 5000] as const

/**
 * Generate a positive delay. Half the time we use one of the two real product
 * delays, otherwise an arbitrary positive delay, so the invariant is exercised
 * both on the concrete values and on the general case.
 */
const arbDelay = fc.oneof(
  fc.constantFrom(...REAL_DELAYS),
  fc.integer({ min: 50, max: 8000 }),
)

/**
 * An event stream modelled as positive gaps (ms) between consecutive events.
 * Gaps both below and above plausible delays let bursts collapse and let quiet
 * periods elapse.
 */
const arbGaps = fc.array(fc.integer({ min: 1, max: 12000 }), {
  minLength: 1,
  maxLength: 20,
})

describe('Property 14: Debounce invariant (umumiy)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Anchor the virtual clock so Date.now() arithmetic is exact.
    vi.setSystemTime(0)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('every invocation is preceded by a full delayMs quiet period', () => {
    fc.assert(
      fc.property(arbGaps, arbDelay, (gaps, delayMs) => {
        const callTimes: number[] = []
        const callArgs: number[] = []
        const fn = vi.fn((arg: number) => {
          callTimes.push(Date.now())
          callArgs.push(arg)
        })

        const debounced = debounce(fn, delayMs)

        // Replay the event stream on the virtual clock. Advancing the timers
        // before each event flushes any pending invocation whose quiet period
        // has elapsed, exactly as it would in real time.
        const eventTimes: number[] = []
        for (const gap of gaps) {
          vi.advanceTimersByTime(gap)
          const now = Date.now()
          eventTimes.push(now)
          debounced(now)
        }

        // Let the final pending invocation fire.
        vi.advanceTimersByTime(delayMs)

        // The debounced fn must fire at least once for a non-empty stream.
        expect(callTimes.length).toBeGreaterThanOrEqual(1)

        for (const callTime of callTimes) {
          // The scheduling event is the most recent event strictly before the
          // invocation (an event landing on the same tick reschedules instead).
          const precedingEvents = eventTimes.filter((t) => t < callTime)
          expect(precedingEvents.length).toBeGreaterThan(0)

          const lastEvent = Math.max(...precedingEvents)
          const quietPeriod = callTime - lastEvent

          // Core invariant: the quiet period equals exactly delayMs, which also
          // proves no event occurred within delayMs before the invocation
          // (any such event would be > lastEvent and shrink the gap).
          expect(quietPeriod).toBe(delayMs)
        }

        // The final invocation always carries the most recent event's argument.
        expect(callArgs[callArgs.length - 1]).toBe(eventTimes[eventTimes.length - 1])
      }),
      { numRuns: 100 },
    )
  })

  it('collapses a burst (all gaps < delay) into a single trailing call with latest args', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string(), { minLength: 2, maxLength: 15 }),
        arbDelay,
        (args, delayMs) => {
          const fn = vi.fn()
          const debounced = debounce(fn, delayMs)

          // Fire every event well within the quiet window so none triggers.
          const step = Math.max(1, Math.floor(delayMs / (args.length + 1)))
          for (const arg of args) {
            debounced(arg)
            vi.advanceTimersByTime(step)
          }

          // No invocation yet: the quiet period has never elapsed.
          expect(fn).not.toHaveBeenCalled()

          vi.advanceTimersByTime(delayMs)

          expect(fn).toHaveBeenCalledTimes(1)
          expect(fn).toHaveBeenCalledWith(args[args.length - 1])
        },
      ),
      { numRuns: 100 },
    )
  })

  it('holds for the autosave delay (5000ms): rapid typing yields one save after the pause', () => {
    const AUTOSAVE_DELAY = 5000
    const fn = vi.fn()
    const debounced = debounce(fn, AUTOSAVE_DELAY)

    for (let i = 0; i < 10; i++) {
      debounced(`answer-${i}`)
      if (i < 9) vi.advanceTimersByTime(200) // keystroke every 200ms, none after the last
    }
    expect(fn).not.toHaveBeenCalled()

    // One tick short of the delay: still no save.
    vi.advanceTimersByTime(AUTOSAVE_DELAY - 1)
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('answer-9')
  })

  it('holds for the reports filter delay (1000ms): rapid changes yield one reload after the pause', () => {
    const FILTER_DELAY = 1000
    const fn = vi.fn()
    const debounced = debounce(fn, FILTER_DELAY)

    for (let i = 0; i < 5; i++) {
      debounced(`filter-${i}`)
      if (i < 4) vi.advanceTimersByTime(100) // change every 100ms, none after the last
    }
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(FILTER_DELAY - 1)
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('filter-4')
  })
})
