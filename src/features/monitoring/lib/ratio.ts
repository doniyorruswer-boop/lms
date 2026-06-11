/**
 * Pure, side-effect-free teacher-to-student ratio logic.
 *
 * `isRatioViolation` decides whether an OTM (institution) breaches the
 * acceptable Teacher_Student_Ratio threshold of 1:50. It is isolated as a pure
 * function so it can be covered by property-based tests and consumed by the
 * Monitoring_Panel UI (highlighting violating institutions in red).
 *
 * See design.md "Property 20: O'qituvchi-talaba nisbati buzilishini aniqlash".
 * Requirements: 13.3 (1:50 dan oshganda qizil ajratish).
 */

/** Maximum allowed students per teacher before a ratio is considered violated. */
const MAX_STUDENTS_PER_TEACHER = 50

/**
 * Determine whether the student/teacher ratio is in violation.
 *
 * Behaviour (for `students >= 0`, `teachers >= 0`):
 * - When `teachers === 0` this is the special "no teachers" case: it is a
 *   violation if and only if there are students to teach (`students > 0`).
 * - When `teachers > 0` it is a violation exactly when
 *   `(students / teachers) > 50`.
 *
 * @param students Number of students (non-negative).
 * @param teachers Number of teachers (non-negative).
 * @returns `true` when the ratio violates the 1:50 threshold.
 */
export function isRatioViolation(students: number, teachers: number): boolean {
  if (teachers === 0) {
    // No-teachers special case: any students with zero teachers is a violation.
    return students > 0
  }

  return students / teachers > MAX_STUDENTS_PER_TEACHER
}
