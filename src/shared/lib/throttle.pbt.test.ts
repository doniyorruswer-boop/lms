/**
 * Property-based tests for throttle utility with fake timers.
 *
 * **Validates: Requirements 4.3, 8.3** (Property 9)
 *
 * The throttle invariant property validates that:
 * - Consecutive invocations are spaced at least intervalMs apart
 * - This applies to video progress sending (10s) and proctoring checks (10s)
 * - ∀ i: callTime[i+1] - callTime[i] >= intervalMs
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import * as fc from "fast-check"
import { throttle } from "./throttle"

describe("Throttle utility properties", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllTimers()
  })

  describe("Property 9: Davriy throttle invariant (10 soniyalik intervallar)", () => {
    it("consecutive invocations are spaced at least intervalMs apart", () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 50000 }), { minLength: 2, maxLength: 20 }), 
          fc.integer({ min: 1000, max: 10000 }),
          (eventTimes, intervalMs) => {
            const callTimes: number[] = []
            const mockFn = vi.fn(() => {
              callTimes.push(Date.now())
            })
            
            const throttled = throttle(mockFn, intervalMs)
            
            // Simulate events at specified times
            let currentTime = 0
            for (const eventTime of eventTimes.sort((a, b) => a - b)) {
              vi.setSystemTime(eventTime)
              throttled(`arg-${eventTime}`)
              currentTime = Math.max(currentTime, eventTime)
            }
            
            // Fast forward to ensure any trailing calls are executed
            vi.advanceTimersByTime(intervalMs * 2)
            
            // Verify the throttle invariant: consecutive calls are at least intervalMs apart
            for (let i = 1; i < callTimes.length; i++) {
              const timeDiff = callTimes[i]! - callTimes[i - 1]!
              expect(timeDiff).toBeGreaterThanOrEqual(intervalMs - 1) // Allow 1ms tolerance for timer precision
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it("leading edge fires immediately on first call", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 10000 }),
          (intervalMs) => {
            const mockFn = vi.fn()
            const throttled = throttle(mockFn, intervalMs)
            
            const startTime = 1000
            vi.setSystemTime(startTime)
            throttled("first")
            
            // First call should fire immediately
            expect(mockFn).toHaveBeenCalledTimes(1)
            expect(mockFn).toHaveBeenCalledWith("first")
          }
        ),
        { numRuns: 100 }
      )
    })

    it("trailing edge fires with latest args after interval", () => {
      fc.assert(
        fc.property(
          fc.array(fc.string(), { minLength: 1, maxLength: 10 }),
          fc.integer({ min: 1000, max: 5000 }),
          (args, intervalMs) => {
            const mockFn = vi.fn()
            const throttled = throttle(mockFn, intervalMs)
            
            // First call (leading edge)
            throttled("first")
            expect(mockFn).toHaveBeenCalledWith("first")
            
            // Rapid calls within interval
            const halfInterval = Math.floor(intervalMs / 2)
            vi.advanceTimersByTime(halfInterval)
            
            for (const arg of args) {
              throttled(arg)
              vi.advanceTimersByTime(10) // Small increments within interval
            }
            
            const initialCallCount = mockFn.mock.calls.length
            
            // Advance past the interval to trigger trailing edge
            vi.advanceTimersByTime(intervalMs)
            
            // Should have one more call (trailing edge) with the last argument
            expect(mockFn).toHaveBeenCalledTimes(initialCallCount + 1)
            if (args.length > 0) {
              expect(mockFn).toHaveBeenLastCalledWith(args[args.length - 1])
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it("cancel prevents trailing edge execution", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 5000 }),
          (intervalMs) => {
            const mockFn = vi.fn()
            const throttled = throttle(mockFn, intervalMs)
            
            // First call
            throttled("first")
            expect(mockFn).toHaveBeenCalledTimes(1)
            
            // Call within interval
            vi.advanceTimersByTime(intervalMs / 2)
            throttled("second")
            
            // Cancel before trailing edge
            throttled.cancel()
            
            // Advance past interval
            vi.advanceTimersByTime(intervalMs)
            
            // Should still only have the initial call
            expect(mockFn).toHaveBeenCalledTimes(1)
          }
        ),
        { numRuns: 100 }
      )
    })

    it("handles 10 second intervals correctly for video progress and proctoring", () => {
      const TEN_SECONDS = 10000
      const callTimes: number[] = []
      const mockFn = vi.fn(() => {
        callTimes.push(Date.now())
      })
      
      const throttled = throttle(mockFn, TEN_SECONDS)
      
      // Simulate rapid calls (like video progress updates or face detection)
      let currentTime = 0
      for (let i = 0; i < 25; i++) {
        currentTime += Math.random() * 2000 // Random intervals up to 2s
        vi.setSystemTime(currentTime)
        throttled(`call-${i}`)
      }
      
      // Fast forward to ensure trailing calls
      vi.advanceTimersByTime(TEN_SECONDS * 2)
      
      // Verify all consecutive calls are at least 10 seconds apart
      for (let i = 1; i < callTimes.length; i++) {
        const timeDiff = callTimes[i]! - callTimes[i - 1]!
        expect(timeDiff).toBeGreaterThanOrEqual(TEN_SECONDS - 1) // Allow 1ms tolerance
      }
    })
  })
})