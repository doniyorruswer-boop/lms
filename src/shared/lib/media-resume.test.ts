/**
 * Property-based tests for video resume position logic (task 5.6).
 *
 * **Property 7: Video davom ettirish o'rni tanlovi**
 * For any `(localPosition, remotePosition)` ikkita manfiy bo'lmagan haqiqiy son uchun, 
 * `chooseResumePosition(local, remote) === max(local, remote)` va natija 
 * `[0, lessonDurationSec]` oraliqda bo'ladi.
 *
 * **Validates: Requirements 4.4**
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { chooseResumePosition } from './media'

describe('Video resume position property (Property 7)', () => {
  it('should return max(local, remote) when both positions are valid', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 10000, noNaN: true }), // local position
        fc.float({ min: 0, max: 10000, noNaN: true }), // remote position
        fc.float({ min: 0, max: 10000, noNaN: true }), // duration (at least as large as positions)
        (local, remote, baseDuration) => {
          // Ensure duration is at least as large as the max position
          const duration = Math.max(baseDuration, Math.max(local, remote))
          
          const result = chooseResumePosition(local, remote, duration)
          const expected = Math.max(local, remote)
          
          expect(result).toBe(expected)
        }
      ),
      { numRuns: 25 }
    )
  })

  it('should clamp result to [0, duration] range', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -1000, max: 20000, noNaN: true }), // local (can be negative or > duration)
        fc.float({ min: -1000, max: 20000, noNaN: true }), // remote (can be negative or > duration)
        fc.float({ min: 1, max: 10000, noNaN: true }), // duration (positive)
        (local, remote, duration) => {
          const result = chooseResumePosition(local, remote, duration)
          
          // Result must be within [0, duration] range
          expect(result).toBeGreaterThanOrEqual(0)
          expect(result).toBeLessThanOrEqual(duration)
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
          fc.float({ min: 0, max: 1000, noNaN: true })
        ),
        fc.oneof(
          fc.constant(NaN),
          fc.constant(Infinity),
          fc.constant(-Infinity),
          fc.float({ min: 0, max: 1000, noNaN: true })
        ),
        fc.float({ min: 1, max: 1000, noNaN: true }),
        (local, remote, duration) => {
          const result = chooseResumePosition(local, remote, duration)
          
          // Result should always be finite and in valid range
          expect(Number.isFinite(result)).toBe(true)
          expect(result).toBeGreaterThanOrEqual(0)
          expect(result).toBeLessThanOrEqual(duration)
        }
      ),
      { numRuns: 25 }
    )
  })

  it('should prefer remote position when local is invalid', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.constant(NaN), fc.constant(Infinity), fc.constant(-Infinity)),
        fc.float({ min: 0, max: 500, noNaN: true }),
        fc.float({ min: 500, max: 1000, noNaN: true }),
        (invalidLocal, validRemote, duration) => {
          const result = chooseResumePosition(invalidLocal, validRemote, duration)
          
          // Should use the valid remote position (clamped to duration if necessary)
          expect(result).toBe(Math.min(validRemote, duration))
        }
      ),
      { numRuns: 25 }
    )
  })

  it('should prefer local position when remote is invalid', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 500, noNaN: true }),
        fc.oneof(fc.constant(NaN), fc.constant(Infinity), fc.constant(-Infinity)),
        fc.float({ min: 500, max: 1000, noNaN: true }),
        (validLocal, invalidRemote, duration) => {
          const result = chooseResumePosition(validLocal, invalidRemote, duration)
          
          // Should use the valid local position (clamped to duration if necessary)
          expect(result).toBe(Math.min(validLocal, duration))
        }
      ),
      { numRuns: 25 }
    )
  })

  it('should return 0 when both positions are invalid', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.constant(NaN), fc.constant(Infinity), fc.constant(-Infinity)),
        fc.oneof(fc.constant(NaN), fc.constant(Infinity), fc.constant(-Infinity)),
        fc.float({ min: 1, max: 1000, noNaN: true }),
        (invalidLocal, invalidRemote, duration) => {
          const result = chooseResumePosition(invalidLocal, invalidRemote, duration)
          
          // Should fall back to 0 when both positions are invalid
          expect(result).toBe(0)
        }
      ),
      { numRuns: 25 }
    )
  })

  it('should be monotonic with respect to both inputs', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.float({ min: 0, max: 500, noNaN: true }),
          fc.float({ min: 0, max: 500, noNaN: true })
        ).filter(([a, b]) => a <= b),
        fc.tuple(
          fc.float({ min: 0, max: 500, noNaN: true }),
          fc.float({ min: 0, max: 500, noNaN: true })
        ).filter(([a, b]) => a <= b),
        fc.float({ min: 500, max: 1000, noNaN: true }),
        ([local1, local2], [remote1, remote2], duration) => {
          // local1 <= local2, remote1 <= remote2
          const result1 = chooseResumePosition(local1, remote1, duration)
          const result2 = chooseResumePosition(local2, remote2, duration)
          
          // If both inputs increase, result should not decrease
          expect(result2).toBeGreaterThanOrEqual(result1)
        }
      ),
      { numRuns: 25 }
    )
  })

  it('should handle edge cases correctly', () => {
    // Both positions are 0
    expect(chooseResumePosition(0, 0, 100)).toBe(0)
    
    // One position is 0
    expect(chooseResumePosition(0, 50, 100)).toBe(50)
    expect(chooseResumePosition(30, 0, 100)).toBe(30)
    
    // Positions equal to duration
    expect(chooseResumePosition(100, 80, 100)).toBe(100)
    expect(chooseResumePosition(80, 100, 100)).toBe(100)
    
    // Positions exceed duration (should be clamped)
    expect(chooseResumePosition(150, 80, 100)).toBe(100)
    expect(chooseResumePosition(80, 150, 100)).toBe(100)
    expect(chooseResumePosition(120, 150, 100)).toBe(100)
    
    // Negative positions (should be treated as 0)
    expect(chooseResumePosition(-10, 50, 100)).toBe(50)
    expect(chooseResumePosition(50, -10, 100)).toBe(50)
    
    // Very small duration
    expect(chooseResumePosition(10, 20, 5)).toBe(5)
    
    // Zero duration
    expect(chooseResumePosition(10, 20, 0)).toBe(0)
  })

  it('should be commutative (order of local and remote does not matter when both are valid)', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 500, noNaN: true }),
        fc.float({ min: 0, max: 500, noNaN: true }),
        fc.float({ min: 500, max: 1000, noNaN: true }),
        (pos1, pos2, duration) => {
          const result1 = chooseResumePosition(pos1, pos2, duration)
          const result2 = chooseResumePosition(pos2, pos1, duration)
          
          // Order should not matter
          expect(result1).toBe(result2)
        }
      ),
      { numRuns: 25 }
    )
  })
})