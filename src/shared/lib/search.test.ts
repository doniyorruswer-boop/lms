/**
 * Property-based tests for course search functionality (task 5.4).
 *
 * **Property 4: Kurslar qidiruvining to'g'riligi**
 * For any `(courses: Course[], query: string)` jufti, `searchCourses(courses, query)` 
 * natijasi `courses` ning kichik to'plami bo'ladi va har bir natija elementi `query` ning 
 * case-insensitive substring sini `name` yoki `teacherName` maydonida saqlaydi; 
 * bo'sh `query` butun ro'yxatni qaytaradi.
 *
 * **Validates: Requirements 3.6**
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { searchCourses } from './search'
import { arbCourse } from '../../test/generators'
import type { CourseLike } from '../../test/generators'

// Cast to match the expected Course type from search function
const arbSearchableCourse = arbCourse.map(course => ({
  ...course,
  // Ensure we have title and teacherName as expected by the search function
  title: course.title,
  teacherName: course.teacherName
})) as fc.Arbitrary<CourseLike>

describe('Course search property (Property 4)', () => {
  it('should return a subset of the input courses', () => {
    fc.assert(
      fc.property(
        fc.array(arbSearchableCourse, { minLength: 0, maxLength: 50 }),
        fc.string({ minLength: 0, maxLength: 20 }),
        (courses, query) => {
          const results = searchCourses(courses, query)
          
          // Result should be a subset (all result items exist in original)
          for (const result of results) {
            expect(courses).toContainEqual(result)
          }
          
          // Result length should not exceed input length
          expect(results.length).toBeLessThanOrEqual(courses.length)
        }
      ),
      { numRuns: 25 }
    )
  })

  it('should return all courses for empty or whitespace-only queries', () => {
    fc.assert(
      fc.property(
        fc.array(arbSearchableCourse, { minLength: 0, maxLength: 20 }),
        fc.oneof(
          fc.constant(''),
          fc.constant('   '),
          fc.constant('\t\n'),
          fc.string().filter(s => s.trim() === '')
        ),
        (courses, emptyQuery) => {
          const results = searchCourses(courses, emptyQuery)
          
          // Should return all courses for empty queries
          expect(results).toHaveLength(courses.length)
          
          // Should be equal but not the same array (to avoid aliasing)
          expect(results).toEqual(courses)
          expect(results).not.toBe(courses) // different array instance
        }
      ),
      { numRuns: 25 }
    )
  })

  it('should only return courses that contain the query substring (case-insensitive)', () => {
    fc.assert(
      fc.property(
        fc.array(arbSearchableCourse, { minLength: 1, maxLength: 30 }),
        fc.string({ minLength: 1, maxLength: 10 }).filter(s => s.trim().length > 0),
        (courses, query) => {
          const results = searchCourses(courses, query)
          const normalizedQuery = query.trim().toLowerCase()
          
          for (const result of results) {
            const titleMatch = result.title.toLowerCase().includes(normalizedQuery)
            const teacherMatch = result.teacherName.toLowerCase().includes(normalizedQuery)
            
            // Each result must match either title or teacherName
            expect(titleMatch || teacherMatch).toBe(true)
          }
        }
      ),
      { numRuns: 25 }
    )
  })

  it('should be case-insensitive', () => {
    fc.assert(
      fc.property(
        fc.array(arbSearchableCourse, { minLength: 5, maxLength: 15 }),
        fc.string({ minLength: 1, maxLength: 5 }).filter(s => s.trim().length > 0 && /^[a-zA-Z]+$/.test(s)),
        (courses, baseQuery) => {
          const lowerQuery = baseQuery.toLowerCase()
          const upperQuery = baseQuery.toUpperCase()
          const mixedQuery = baseQuery.split('').map((c, i) => 
            i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()
          ).join('')
          
          const lowerResults = searchCourses(courses, lowerQuery)
          const upperResults = searchCourses(courses, upperQuery)
          const mixedResults = searchCourses(courses, mixedQuery)
          
          // All case variations should return the same results
          expect(lowerResults).toEqual(upperResults)
          expect(lowerResults).toEqual(mixedResults)
        }
      ),
      { numRuns: 25 }
    )
  })

  it('should preserve order of matching courses', () => {
    fc.assert(
      fc.property(
        fc.array(arbSearchableCourse, { minLength: 3, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 8 }).filter(s => s.trim().length > 0),
        (courses, query) => {
          const results = searchCourses(courses, query)
          
          // Find the indices of results in the original array
          const resultIndices = results.map(result => courses.findIndex(c => c === result))
          
          // Indices should be in ascending order (preserving original order)
          for (let i = 1; i < resultIndices.length; i++) {
            expect(resultIndices[i]).toBeGreaterThan(resultIndices[i - 1])
          }
        }
      ),
      { numRuns: 25 }
    )
  })

  it('should handle queries that match both title and teacherName', () => {
    // Create courses where some have overlapping content
    const testCourses = [
      { id: '1', title: 'Math Basics', teacherName: 'John Smith', direction: 'BACHELOR' as const, semester: 1, capacity: 30, enrolledCount: 20, progressPercent: 75 },
      { id: '2', title: 'Advanced Math', teacherName: 'Math Professor', direction: 'MASTER' as const, semester: 2, capacity: 20, enrolledCount: 15, progressPercent: 50 },
      { id: '3', title: 'Physics', teacherName: 'Jane Doe', direction: 'BACHELOR' as const, semester: 1, capacity: 25, enrolledCount: 25, progressPercent: 90 }
    ]
    
    // Query that matches both course title and a teacher name
    const results = searchCourses(testCourses, 'math')
    
    // Should match both "Math Basics" (title) and "Advanced Math" (title) and "Math Professor" (teacher)
    expect(results).toHaveLength(2)
    expect(results.map(r => r.id).sort()).toEqual(['1', '2'])
  })

  it('should not mutate the input array', () => {
    fc.assert(
      fc.property(
        fc.array(arbSearchableCourse, { minLength: 1, maxLength: 10 }),
        fc.string({ minLength: 0, maxLength: 10 }),
        (courses, query) => {
          const originalCourses = JSON.parse(JSON.stringify(courses))
          const results = searchCourses(courses, query)
          
          // Original array should be unchanged
          expect(courses).toEqual(originalCourses)
          
          // Results should be a new array
          expect(results).not.toBe(courses)
        }
      ),
      { numRuns: 25 }
    )
  })

  it('should handle unicode and special characters in queries', () => {
    const testCourses = [
      { id: '1', title: 'Математика', teacherName: 'Иван Иванов', direction: 'BACHELOR' as const, semester: 1, capacity: 30, enrolledCount: 20, progressPercent: 75 },
      { id: '2', title: 'Física Cuántica', teacherName: 'María García', direction: 'MASTER' as const, semester: 2, capacity: 20, enrolledCount: 15, progressPercent: 50 },
      { id: '3', title: '计算机科学', teacherName: '李老师', direction: 'BACHELOR' as const, semester: 1, capacity: 25, enrolledCount: 25, progressPercent: 90 }
    ]
    
    expect(searchCourses(testCourses, 'мат')).toHaveLength(1)
    expect(searchCourses(testCourses, 'física')).toHaveLength(1)
    expect(searchCourses(testCourses, '计算机')).toHaveLength(1)
    expect(searchCourses(testCourses, '李')).toHaveLength(1)
  })
})