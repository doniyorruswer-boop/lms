/**
 * Property-based tests for progress percentage calculation (Task 7.4).
 * 
 * **Validates: Requirements 12.3**
 * **Property 19: Sinxronizatsiya progress foizi clamp**
 * 
 * Tests that computeProgressPct correctly handles all edge cases:
 * - Result is always in [0, 100] range
 * - When total === 0, returns 0 (no division by zero)
 * - When processed === total > 0, returns exactly 100
 * - Handles non-finite inputs gracefully
 * Uses fast-check with { numRuns: 25 } for faster execution as requested.
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { computeProgressPct } from './progress'

describe('computeProgressPct property-based tests', () => {
  it('Property 19: Sinxronizatsiya progress foizi clamp', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -1000, max: 1000 }), // processed (can be negative or non-finite)
        fc.float({ min: -1000, max: 1000 }), // total (can be negative or non-finite)
        (processed, total) => {
          const result = computeProgressPct(processed, total)

          // Core invariant: result is always in [0, 100]
          expect(result).toBeGreaterThanOrEqual(0)
          expect(result).toBeLessThanOrEqual(100)
          expect(Number.isFinite(result)).toBe(true)
        }
      ),
      { numRuns: 25 }
    )
  })

  it('Property 19: Special cases - zero total returns zero', () => {
    fc.assert(
      fc.property(
        fc.float(), // any processed value
        (processed) => {
          // When total is 0, should always return 0 (no division by zero)
          expect(computeProgressPct(processed, 0)).toBe(0)
        }
      ),
      { numRuns: 25 }
    )
  })

  it('Property 19: Complete processing returns 100', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0.1, max: 1000 }), // positive total
        (total) => {
          // When processed equals total, should return exactly 100
          expect(computeProgressPct(total, total)).toBe(100)
        }
      ),
      { numRuns: 25 }
    )
  })

  it('Property 19: Processed cannot exceed total effect', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 1, max: 100 }), // total
        fc.float({ min: 101, max: 1000 }), // processed > total
        (total, processed) => {
          // Even when processed > total, result should be clamped
          const result = computeProgressPct(processed, total)
          expect(result).toBe(100) // Should be clamped to 100%
        }
      ),
      { numRuns: 25 }
    )
  })

  it('Property 19: Non-finite inputs are handled', () => {
    // Test NaN, Infinity, -Infinity inputs
    expect(computeProgressPct(NaN, 100)).toBe(0)
    expect(computeProgressPct(50, NaN)).toBe(0)
    expect(computeProgressPct(Infinity, 100)).toBe(100)
    expect(computeProgressPct(50, Infinity)).toBe(0)
    expect(computeProgressPct(-Infinity, 100)).toBe(0)
    expect(computeProgressPct(50, -Infinity)).toBe(0)
  })

  it('Property 19: Negative inputs are sanitized', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -1000, max: -0.1 }), // negative processed
        fc.float({ min: 1, max: 1000 }), // positive total
        (processed, total) => {
          // Negative processed should be treated as 0
          expect(computeProgressPct(processed, total)).toBe(0)
        }
      ),
      { numRuns: 25 }
    )
  })

  it('Property 19: Partial progress within bounds', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 1, max: 1000 }), // total
        fc.float({ min: 0, max: 1 }), // fraction [0,1]
        (total, fraction) => {
          const processed = total * fraction
          const result = computeProgressPct(processed, total)
          
          // Should be proportional and within bounds
          expect(result).toBeGreaterThanOrEqual(0)
          expect(result).toBeLessThanOrEqual(100)
          
          // Should be approximately correct for reasonable inputs
          if (Number.isFinite(processed) && Number.isFinite(total) && total > 0) {
            const expected = Math.min(Math.max((processed / total) * 100, 0), 100)
            expect(Math.abs(result - expected)).toBeLessThan(0.01) // Allow for floating point precision
          }
        }
      ),
      { numRuns: 25 }
    )
  })
})