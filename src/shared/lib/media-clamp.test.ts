/**
 * Property-based tests for media seek/page clamping logic (task 5.7).
 *
 * **Property 8: Klaviatura seek va PDF sahifa clamp invariant**
 * For any `(currentTime, duration, key, delta)` (video uchun) yoki `(page, total)` 
 * (PDF uchun), seek/sahifa-o'tish funksiyasining natijasi mos chegarada bo'lishi kerak: 
 * video uchun `[0, duration]`, PDF uchun `[1, total]`.
 *
 * **Validates: Requirements 4.6, 5.2**
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { clampSeek, clampPage } from './media'

describe('Media seek and page clamp properties (Property 8)', () => {
  describe('Video seek clamping (clampSeek)', () => {
    it('should always return a value within [0, duration] range', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -1000, max: 2000, noNaN: true }), // currentTime (can be out of range)
          fc.float({ min: 0, max: 3600, noNaN: true }), // duration (non-negative)
          fc.float({ min: -300, max: 300, noNaN: true }), // delta (seek amount)
          (currentTime, duration, delta) => {
            const result = clampSeek(currentTime, duration, delta)
            
            // Result must be within [0, duration]
            expect(result).toBeGreaterThanOrEqual(0)
            expect(result).toBeLessThanOrEqual(duration)
            expect(Number.isFinite(result)).toBe(true)
          }
        ),
        { numRuns: 25 }
      )
    })

    it('should apply delta correctly when result stays in bounds', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 10, max: 100, noNaN: true }), // currentTime (well within bounds)
          fc.float({ min: 200, max: 500, noNaN: true }), // duration (larger than currentTime)
          fc.float({ min: -5, max: 5, noNaN: true }), // small delta
          (currentTime, duration, delta) => {
            const targetTime = currentTime + delta
            
            // Only check when target would be in bounds
            if (targetTime >= 0 && targetTime <= duration) {
              const result = clampSeek(currentTime, duration, delta)
              expect(result).toBeCloseTo(targetTime, 6)
            }
          }
        ),
        { numRuns: 25 }
      )
    })

    it('should clamp to 0 when seeking before start', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 50, noNaN: true }), // currentTime
          fc.float({ min: 100, max: 500, noNaN: true }), // duration
          fc.float({ min: -1000, max: -51, noNaN: true }), // large negative delta
          (currentTime, duration, largeDelta) => {
            const result = clampSeek(currentTime, duration, largeDelta)
            
            // Should be clamped to 0
            expect(result).toBe(0)
          }
        ),
        { numRuns: 25 }
      )
    })

    it('should clamp to duration when seeking beyond end', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 50, max: 100, noNaN: true }), // currentTime
          fc.float({ min: 100, max: 200, noNaN: true }), // duration
          fc.float({ min: 101, max: 1000, noNaN: true }), // large positive delta
          (currentTime, duration, largeDelta) => {
            const result = clampSeek(currentTime, duration, largeDelta)
            
            // Should be clamped to duration (use closeTo for floating point precision)
            expect(result).toBeCloseTo(duration, 10)
          }
        ),
        { numRuns: 25 }
      )
    })

    it('should handle non-finite inputs gracefully', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(NaN),
            fc.constant(Infinity),
            fc.constant(-Infinity),
            fc.float({ min: 0, max: 100, noNaN: true })
          ),
          fc.float({ min: 1, max: 100, noNaN: true }), // duration (always finite and positive)
          fc.oneof(
            fc.constant(NaN),
            fc.constant(Infinity),
            fc.constant(-Infinity),
            fc.float({ min: -50, max: 50, noNaN: true })
          ),
          (currentTime, duration, delta) => {
            const result = clampSeek(currentTime, duration, delta)
            
            // Result should always be finite and in range
            expect(Number.isFinite(result)).toBe(true)
            expect(result).toBeGreaterThanOrEqual(0)
            expect(result).toBeLessThanOrEqual(duration)
          }
        ),
        { numRuns: 25 }
      )
    })

    it('should handle keyboard navigation deltas (±5 seconds)', () => {
      const fiveSecondsForward = 5
      const fiveSecondsBackward = -5
      
      fc.assert(
        fc.property(
          fc.float({ min: 10, max: 300, noNaN: true }), // currentTime
          fc.float({ min: 400, max: 3600, noNaN: true }), // duration (longer content)
          (currentTime, duration) => {
            const forward = clampSeek(currentTime, duration, fiveSecondsForward)
            const backward = clampSeek(currentTime, duration, fiveSecondsBackward)
            
            // Forward seek should increase position by 5 (if in bounds)
            if (currentTime + 5 <= duration) {
              expect(forward).toBeCloseTo(currentTime + 5, 6)
            } else {
              expect(forward).toBe(duration)
            }
            
            // Backward seek should decrease position by 5 (if in bounds)
            if (currentTime - 5 >= 0) {
              expect(backward).toBeCloseTo(currentTime - 5, 6)
            } else {
              expect(backward).toBe(0)
            }
          }
        ),
        { numRuns: 25 }
      )
    })
  })

  describe('PDF page clamping (clampPage)', () => {
    it('should always return a value within [1, total] range', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -100, max: 200, noNaN: true }), // page (can be out of range)
          fc.integer({ min: 1, max: 1000 }), // total pages (at least 1)
          (page, total) => {
            const result = clampPage(page, total)
            
            // Result must be within [1, total]
            expect(result).toBeGreaterThanOrEqual(1)
            expect(result).toBeLessThanOrEqual(total)
            expect(Number.isInteger(result)).toBe(true)
          }
        ),
        { numRuns: 25 }
      )
    })

    it('should floor fractional page numbers', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(1.1), max: Math.fround(50.9), noNaN: true }), // fractional page
          fc.integer({ min: 100, max: 200 }), // total (larger than page)
          (fractionalPage, total) => {
            const result = clampPage(fractionalPage, total)
            
            // Should be floored to integer
            expect(result).toBe(Math.floor(fractionalPage))
            expect(Number.isInteger(result)).toBe(true)
          }
        ),
        { numRuns: 25 }
      )
    })

    it('should clamp to 1 when page is less than 1', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(-1000), max: Math.fround(0.99), noNaN: true }), // page < 1
          fc.integer({ min: 1, max: 100 }), // total
          (lowPage, total) => {
            const result = clampPage(lowPage, total)
            
            // Should be clamped to 1
            expect(result).toBe(1)
          }
        ),
        { numRuns: 25 }
      )
    })

    it('should clamp to total when page exceeds total', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }), // total
          fc.float({ min: 1, max: 100, noNaN: true }), // excess amount
          (total, excess) => {
            const highPage = total + excess
            const result = clampPage(highPage, total)
            
            // Should be clamped to total
            expect(result).toBe(total)
          }
        ),
        { numRuns: 25 }
      )
    })

    it('should handle non-finite page inputs gracefully', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(NaN),
            fc.constant(Infinity),
            fc.constant(-Infinity)
          ),
          fc.integer({ min: 1, max: 100 }),
          (invalidPage, total) => {
            const result = clampPage(invalidPage, total)
            
            // Should fall back to 1 for invalid page
            expect(result).toBe(1)
          }
        ),
        { numRuns: 25 }
      )
    })

    it('should handle edge case where total < 1', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 1, max: 100, noNaN: true }),
          fc.oneof(
            fc.constant(0),
            fc.constant(-5),
            fc.constant(NaN),
            fc.constant(-Infinity)
          ),
          (page, invalidTotal) => {
            const result = clampPage(page, invalidTotal)
            
            // Should return 1 when total is invalid
            expect(result).toBe(1)
          }
        ),
        { numRuns: 25 }
      )
    })

    it('should be idempotent for valid inputs', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }), // valid page
          fc.integer({ min: 50, max: 100 }), // total (>= page)
          (page, total) => {
            const result1 = clampPage(page, total)
            const result2 = clampPage(result1, total)
            
            // Applying clamp twice should give same result
            expect(result1).toBe(result2)
            expect(result1).toBe(page) // Should be unchanged for valid input
          }
        ),
        { numRuns: 25 }
      )
    })

    it('should handle typical PDF navigation scenarios', () => {
      const total = 100
      
      // Navigate to first page
      expect(clampPage(1, total)).toBe(1)
      
      // Navigate to last page
      expect(clampPage(total, total)).toBe(total)
      
      // Navigate beyond bounds
      expect(clampPage(0, total)).toBe(1)
      expect(clampPage(-5, total)).toBe(1)
      expect(clampPage(total + 10, total)).toBe(total)
      
      // Fractional inputs (could come from calculations)
      expect(clampPage(5.7, total)).toBe(5)
      expect(clampPage(99.99, total)).toBe(99)
    })
  })

  describe('Combined invariants', () => {
    it('should maintain range constraints regardless of input values', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -1000, max: 2000, noNaN: true }),
          fc.float({ min: 0, max: 1000, noNaN: true }),
          fc.float({ min: -500, max: 500, noNaN: true }),
          fc.integer({ min: 1, max: 200 }),
          fc.float({ min: -100, max: 300, noNaN: true }),
          (currentTime, duration, delta, totalPages, targetPage) => {
            const seekResult = clampSeek(currentTime, duration, delta)
            const pageResult = clampPage(targetPage, totalPages)
            
            // Seek result in [0, duration]
            expect(seekResult).toBeGreaterThanOrEqual(0)
            expect(seekResult).toBeLessThanOrEqual(duration)
            
            // Page result in [1, totalPages]
            expect(pageResult).toBeGreaterThanOrEqual(1)
            expect(pageResult).toBeLessThanOrEqual(totalPages)
          }
        ),
        { numRuns: 25 }
      )
    })
  })
})