import type { Course } from "../types/course"

/**
 * Course search utility (pure logic).
 *
 * Filters a list of courses by a free-text query. The match is a
 * case-insensitive substring test against the course `title` and
 * `teacherName` fields (Requirement 3.6).
 *
 * Behaviour (design Property 4):
 * - The result is always a subset of the input `courses` (order preserved).
 * - Every returned course contains the case-insensitive substring of the
 *   (trimmed) `query` in either its `title` or its `teacherName`.
 * - An empty query (empty string or whitespace only) returns the full list.
 *
 * The function is side-effect free and never mutates its inputs.
 */
export function searchCourses(courses: Course[], query: string): Course[] {
  const normalized = query.trim().toLowerCase()

  // Empty query → full list (returned as a new array to avoid aliasing).
  if (normalized === "") {
    return [...courses]
  }

  return courses.filter((course) => {
    const title = course.title.toLowerCase()
    const teacher = course.teacherName.toLowerCase()
    return title.includes(normalized) || teacher.includes(normalized)
  })
}
