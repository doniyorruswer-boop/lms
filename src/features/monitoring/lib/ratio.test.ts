/**
 * Property-based tests for teacher-student ratio violation detection (Task 7.6).
 * 
 * **Validates: Requirements 13.3**
 * **Property 20: O'qituvchi-talaba nisbati buzilishini aniqlash**
 * 
 * Tests that isRatioViolation correctly identifies violations:
 * - When teachers === 0: violation iff students > 0 (special "no teachers" case)
 * - When teachers > 0: violation iff (students / teachers) > 50
 * - The 1:50 threshold from regulation 559, article 26
 * Uses fast-check with { numRuns: 25 } for faster execution as requested.
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { isRatioViolation } from './ratio'

describe('isRatioViolation property-based tests', () => {
  it('Property 20: O\'qituvchi-talaba nisbati buzilishini aniqlash', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 2000 }), // students (non-negative integer)
        fc.nat({ max: 100 }), // teachers (non-negative integer)
        (students, teachers) => {
          const result = isRatioViolation(students, teachers)

          if (teachers === 0) {
            // Special "no teachers" case: violation iff there are students to teach
            expect(result).toBe(students > 0)
          } else {
            // Normal case: violation iff ratio > 50
            const ratio = students / teachers
            expect(result).toBe(ratio > 50)
          }
        }
      ),
      { numRuns: 25 }
    )
  })

  it('Property 20: Zero teachers special case', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 1000 }), // students
        (students) => {
          const result = isRatioViolation(students, 0)
          // No teachers: violation only if there are students
          expect(result).toBe(students > 0)
        }
      ),
      { numRuns: 25 }
    )
  })

  it('Property 20: Exact 1:50 threshold behavior', () => {
    // Test exact boundary cases
    expect(isRatioViolation(50, 1)).toBe(false) // Exactly 50:1 - not a violation
    expect(isRatioViolation(51, 1)).toBe(true)  // 51:1 - violation
    expect(isRatioViolation(100, 2)).toBe(false) // Exactly 50:1 - not a violation  
    expect(isRatioViolation(101, 2)).toBe(true)  // 50.5:1 - violation
  })

  it('Property 20: No violation with acceptable ratios', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }), // students <= 50
        fc.integer({ min: 1, max: 10 }), // teachers >= 1
        (students, teachers) => {
          // When students/teachers <= 50, should not be a violation
          const result = isRatioViolation(students, teachers)
          const ratio = students / teachers
          
          if (ratio <= 50) {
            expect(result).toBe(false)
          }
        }
      ),
      { numRuns: 25 }
    )
  })

  it('Property 20: Always violation when ratio > 50', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }), // teachers
        fc.float({ min: 50.1, max: 200 }), // multiplier > 50
        (teachers, multiplier) => {
          const students = Math.floor(teachers * multiplier)
          const result = isRatioViolation(students, teachers)
          
          // Should always be a violation when ratio > 50
          expect(result).toBe(true)
        }
      ),
      { numRuns: 25 }
    )
  })

  it('Property 20: Zero students never violation (except with zero teachers)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // teachers > 0
        (teachers) => {
          // Zero students with any number of teachers is not a violation
          expect(isRatioViolation(0, teachers)).toBe(false)
        }
      ),
      { numRuns: 25 }
    )

    // But zero students with zero teachers is also not a violation
    expect(isRatioViolation(0, 0)).toBe(false)
  })

  it('Property 20: Deterministic for same inputs', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 1000 }), // students
        fc.nat({ max: 50 }), // teachers
        (students, teachers) => {
          // Function should be deterministic
          const result1 = isRatioViolation(students, teachers)
          const result2 = isRatioViolation(students, teachers)
          expect(result1).toBe(result2)
        }
      ),
      { numRuns: 25 }
    )
  })
})