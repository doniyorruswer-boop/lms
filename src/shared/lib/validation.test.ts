/**
 * Property-based tests for course capacity validation (Task 7.2).
 * 
 * **Validates: Requirements 11.4, 11.5, 11.6**
 * **Property 18: Kurs sig'imi yo'nalish bo'yicha validatsiyasi**
 * 
 * Tests that courseSchema validation correctly enforces contingent limits:
 * - BACHELOR direction: capacity <= 300
 * - MASTER direction: capacity <= 30
 * Uses fast-check with { numRuns: 25 } for faster execution as requested.
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { courseSchema, CONTINGENT_LIMITS, contingentLimitMessage } from './validation'
import { arbDirection, arbCapacity } from '@/test/generators'

describe('courseSchema property-based validation', () => {
  it('Property 18: Kurs sig\'imi yo\'nalish bo\'yicha validatsiyasi', () => {
    fc.assert(
      fc.property(
        arbDirection,
        arbCapacity,
        fc.string({ minLength: 1, maxLength: 50 }), // title
        fc.integer({ min: 1, max: 8 }), // semester
        fc.string({ minLength: 1, maxLength: 50 }), // teacherName
        (direction, capacity, title, semester, teacherName) => {
          const formData = {
            title,
            direction,
            semester,
            teacherName,
            capacity,
          }

          const result = courseSchema.safeParse(formData)
          const limit = CONTINGENT_LIMITS[direction]
          const shouldPass = capacity <= limit

          if (shouldPass) {
            // Within limits - should pass validation
            expect(result.success).toBe(true)
          } else {
            // Over limits - should fail with specific capacity error
            expect(result.success).toBe(false)
            if (!result.success) {
              const capacityError = result.error.issues.find(
                issue => issue.path.includes('capacity')
              )
              expect(capacityError).toBeDefined()
              expect(capacityError?.message).toBe(contingentLimitMessage(direction))
            }
          }
        }
      ),
      { numRuns: 25 }
    )
  })

  it('Property 18 edge cases: exact limits should pass', () => {
    // Test exact boundary values
    const bachelorExactLimit = {
      title: 'Test Course',
      direction: 'BACHELOR' as const,
      semester: 1,
      teacherName: 'Test Teacher',
      capacity: 300, // Exact BACHELOR limit
    }

    const masterExactLimit = {
      title: 'Test Course',
      direction: 'MASTER' as const,
      semester: 1,
      teacherName: 'Test Teacher',
      capacity: 30, // Exact MASTER limit
    }

    expect(courseSchema.safeParse(bachelorExactLimit).success).toBe(true)
    expect(courseSchema.safeParse(masterExactLimit).success).toBe(true)
  })

  it('Property 18 edge cases: over limits should fail', () => {
    // Test values just over the limits
    const bachelorOverLimit = {
      title: 'Test Course',
      direction: 'BACHELOR' as const,
      semester: 1,
      teacherName: 'Test Teacher',
      capacity: 301, // Over BACHELOR limit
    }

    const masterOverLimit = {
      title: 'Test Course',
      direction: 'MASTER' as const,
      semester: 1,
      teacherName: 'Test Teacher',
      capacity: 31, // Over MASTER limit
    }

    const bachelorResult = courseSchema.safeParse(bachelorOverLimit)
    const masterResult = courseSchema.safeParse(masterOverLimit)

    expect(bachelorResult.success).toBe(false)
    expect(masterResult.success).toBe(false)

    // Check error messages reference the regulation
    if (!bachelorResult.success) {
      const error = bachelorResult.error.issues[0]
      expect(error.message).toContain('559-son qaror, 20-band')
    }

    if (!masterResult.success) {
      const error = masterResult.error.issues[0]
      expect(error.message).toContain('559-son qaror, 20-band')
    }
  })
})