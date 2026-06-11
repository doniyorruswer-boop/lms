/**
 * Property-based tests for session expiry logic (task 5.2).
 *
 * **Property 6: Sessiya muddatini hisoblash**
 * For any `(lastActivityAt, now, threshold)` qiymatlari uchun (`now ≥ lastActivityAt`), 
 * `computeIsExpired(lastActivityAt, now, threshold) === ((now - lastActivityAt) > threshold)`.
 * `threshold = 30 * 60 * 1000` ms uchun bu 30 daqiqa idle qoidasini ifodalaydi.
 *
 * **Validates: Requirements 1.9**
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { computeIsExpired, THRESHOLD } from './session-logic'

describe('Session expiry property (Property 6)', () => {
  it('should correctly implement the expiry formula: (now - lastActivityAt) > threshold', () => {
    fc.assert(
      fc.property(
        // Generate lastActivityAt and a non-negative time difference
        fc.tuple(
          fc.integer({ min: 0, max: 2_000_000_000_000 }), // lastActivityAt (epoch ms)
          fc.integer({ min: 0, max: 7_200_000 }) // time difference up to 2 hours
        ),
        fc.integer({ min: 1_000, max: 7_200_000 }), // threshold (1s to 2h)
        ([lastActivityAt, timeDiff], threshold) => {
          const now = lastActivityAt + timeDiff
          
          // Ensure now >= lastActivityAt (time moves forward)
          expect(now).toBeGreaterThanOrEqual(lastActivityAt)
          
          const result = computeIsExpired(lastActivityAt, now, threshold)
          const expected = (now - lastActivityAt) > threshold
          
          expect(result).toBe(expected)
        }
      ),
      { numRuns: 25 }
    )
  })

  it('should use default THRESHOLD when not provided', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.integer({ min: 0, max: 1_000_000_000 }),
          fc.integer({ min: 0, max: 3_600_000 }) // up to 1 hour difference
        ),
        ([lastActivityAt, timeDiff]) => {
          const now = lastActivityAt + timeDiff
          
          const resultWithDefault = computeIsExpired(lastActivityAt, now)
          const resultWithExplicit = computeIsExpired(lastActivityAt, now, THRESHOLD)
          
          expect(resultWithDefault).toBe(resultWithExplicit)
        }
      ),
      { numRuns: 25 }
    )
  })

  it('should return false when exactly at threshold (boundary condition)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000_000 }),
        fc.integer({ min: 1_000, max: 3_600_000 }),
        (lastActivityAt, threshold) => {
          const now = lastActivityAt + threshold // exactly at threshold
          
          const result = computeIsExpired(lastActivityAt, now, threshold)
          
          // At exactly threshold, session should still be active
          expect(result).toBe(false)
        }
      ),
      { numRuns: 25 }
    )
  })

  it('should return true when threshold is exceeded by any amount', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000_000 }),
        fc.integer({ min: 1_000, max: 1_800_000 }), // threshold
        fc.integer({ min: 1, max: 60_000 }), // excess time
        (lastActivityAt, threshold, excess) => {
          const now = lastActivityAt + threshold + excess // threshold + some excess
          
          const result = computeIsExpired(lastActivityAt, now, threshold)
          
          // Should be expired when threshold is exceeded
          expect(result).toBe(true)
        }
      ),
      { numRuns: 25 }
    )
  })

  it('should handle the 30-minute default threshold correctly', () => {
    const thirtyMinutesMs = 30 * 60 * 1000
    expect(THRESHOLD).toBe(thirtyMinutesMs)
    
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000_000 }),
        (lastActivityAt) => {
          // Test points around the 30-minute mark
          const almostExpired = lastActivityAt + thirtyMinutesMs - 1000 // 29 min 59 sec
          const exactlyAtThreshold = lastActivityAt + thirtyMinutesMs // exactly 30 min
          const justExpired = lastActivityAt + thirtyMinutesMs + 1000 // 30 min 1 sec
          
          expect(computeIsExpired(lastActivityAt, almostExpired)).toBe(false)
          expect(computeIsExpired(lastActivityAt, exactlyAtThreshold)).toBe(false)
          expect(computeIsExpired(lastActivityAt, justExpired)).toBe(true)
        }
      ),
      { numRuns: 25 }
    )
  })

  it('should handle edge cases with zero values', () => {
    // When lastActivityAt and now are both 0
    expect(computeIsExpired(0, 0, 1000)).toBe(false)
    
    // When threshold is 0 (any positive time difference should expire)
    expect(computeIsExpired(0, 1, 0)).toBe(true)
    expect(computeIsExpired(0, 0, 0)).toBe(false)
    
    // When time difference is 0
    const now = Date.now()
    expect(computeIsExpired(now, now, 1000)).toBe(false)
  })

  it('should be monotonic: larger time differences are more likely to be expired', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000_000 }),
        fc.integer({ min: 1_000, max: 1_800_000 }),
        fc.integer({ min: 0, max: 300_000 }),
        fc.integer({ min: 1, max: 300_000 }),
        (lastActivityAt, threshold, smallDiff, additionalDiff) => {
          const nearTime = lastActivityAt + smallDiff
          const farTime = lastActivityAt + smallDiff + additionalDiff
          
          const nearExpired = computeIsExpired(lastActivityAt, nearTime, threshold)
          const farExpired = computeIsExpired(lastActivityAt, farTime, threshold)
          
          // If the near time is expired, the far time must also be expired
          if (nearExpired) {
            expect(farExpired).toBe(true)
          }
        }
      ),
      { numRuns: 25 }
    )
  })
})