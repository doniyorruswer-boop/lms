/**
 * Property-based tests for backoff sequence computation.
 *
 * **Validates: Requirements 16.5, 21.4** (Property 23)
 *
 * The exponential backoff sequence property validates that:
 * - Reconnect delays follow the table [1000,2000,4000,8000,16000] (cap)
 * - 5xx retry delays follow the table [300,900,2700]
 * - Both sequences are nondecreasing and return only values from their tables
 */

import { describe, it, expect } from "vitest"
import * as fc from "fast-check"
import { computeReconnectDelay, compute5xxRetryDelay } from "./backoff"

describe("Backoff sequence properties", () => {
  const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000] as const
  const RETRY_5XX_DELAYS = [300, 900, 2700] as const

  describe("Property 23: Eksponensial backoff ketma-ketligi", () => {
    it("computeReconnectDelay follows the correct table and is capped", () => {
      fc.assert(
        fc.property(fc.integer({ min: -100, max: 1000 }), (n) => {
          const delay = computeReconnectDelay(n)

          // Must return a value from the table
          expect(RECONNECT_DELAYS).toContain(delay)

          // For valid indices, should match the expected position
          if (n >= 0 && n < RECONNECT_DELAYS.length) {
            expect(delay).toBe(RECONNECT_DELAYS[Math.floor(n)])
          }

          // For n >= 4, should be capped at the last value
          if (n >= 4) {
            expect(delay).toBe(16000)
          }

          // For negative or invalid n, should be the first value
          if (!Number.isFinite(n) || n <= 0) {
            expect(delay).toBe(1000)
          }
        }),
        { numRuns: 100 }
      )
    })

    it("computeReconnectDelay is nondecreasing", () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.integer({ min: 0, max: 10 }),
            fc.integer({ min: 0, max: 10 })
          ).filter(([a, b]) => a <= b),
          ([n1, n2]) => {
            const delay1 = computeReconnectDelay(n1)
            const delay2 = computeReconnectDelay(n2)

            // Sequence must be nondecreasing
            expect(delay1).toBeLessThanOrEqual(delay2)
          }
        ),
        { numRuns: 100 }
      )
    })

    it("compute5xxRetryDelay follows the correct table and is capped", () => {
      fc.assert(
        fc.property(fc.integer({ min: -100, max: 1000 }), (n) => {
          const delay = compute5xxRetryDelay(n)

          // Must return a value from the table
          expect(RETRY_5XX_DELAYS).toContain(delay)

          // For valid indices, should match the expected position
          if (n >= 0 && n < RETRY_5XX_DELAYS.length) {
            expect(delay).toBe(RETRY_5XX_DELAYS[Math.floor(n)])
          }

          // For n >= 2, should be capped at the last value
          if (n >= 2) {
            expect(delay).toBe(2700)
          }

          // For negative or invalid n, should be the first value
          if (!Number.isFinite(n) || n <= 0) {
            expect(delay).toBe(300)
          }
        }),
        { numRuns: 100 }
      )
    })

    it("compute5xxRetryDelay is nondecreasing", () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.integer({ min: 0, max: 10 }),
            fc.integer({ min: 0, max: 10 })
          ).filter(([a, b]) => a <= b),
          ([n1, n2]) => {
            const delay1 = compute5xxRetryDelay(n1)
            const delay2 = compute5xxRetryDelay(n2)

            // Sequence must be nondecreasing
            expect(delay1).toBeLessThanOrEqual(delay2)
          }
        ),
        { numRuns: 100 }
      )
    })

    it("handles edge cases correctly", () => {
      // Per the implementation contract, non-finite inputs (Infinity / NaN)
      // collapse to the FIRST table entry, while large finite values cap at the last.
      expect(computeReconnectDelay(Number.POSITIVE_INFINITY)).toBe(1000)
      expect(computeReconnectDelay(Number.NEGATIVE_INFINITY)).toBe(1000)
      expect(computeReconnectDelay(Number.NaN)).toBe(1000)
      expect(computeReconnectDelay(999999)).toBe(16000)

      expect(compute5xxRetryDelay(Number.POSITIVE_INFINITY)).toBe(300)
      expect(compute5xxRetryDelay(Number.NEGATIVE_INFINITY)).toBe(300)
      expect(compute5xxRetryDelay(Number.NaN)).toBe(300)
      expect(compute5xxRetryDelay(999999)).toBe(2700)
    })

    it("fractional inputs are floored correctly", () => {
      // Test that fractional values are floored to integer indices
      expect(computeReconnectDelay(0.9)).toBe(1000)  // floor(0.9) = 0 -> first entry
      expect(computeReconnectDelay(1.5)).toBe(2000)  // floor(1.5) = 1 -> second entry
      expect(computeReconnectDelay(2.9)).toBe(4000)  // floor(2.9) = 2 -> third entry

      expect(compute5xxRetryDelay(0.9)).toBe(300)    // floor(0.9) = 0 -> first entry
      expect(compute5xxRetryDelay(1.5)).toBe(900)    // floor(1.5) = 1 -> second entry
    })
  })
})
