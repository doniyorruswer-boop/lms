/**
 * Pure, side-effect-free aggregation helpers for the Monitoring_Panel
 * indicator cards (Req 13.1 — umumiy talabalar/o'qituvchilar/kurslar soni).
 */

import type { OtmStats } from '@/shared/types'

/** System-wide totals derived from per-OTM statistics. */
export interface IndicatorTotals {
  students: number
  teachers: number
  courses: number
}

/**
 * Sum per-OTM counts into nationwide indicator totals (Req 13.1).
 *
 * Returns zeroes for an empty input.
 */
export function computeIndicatorTotals(
  stats: readonly OtmStats[],
): IndicatorTotals {
  return stats.reduce<IndicatorTotals>(
    (acc, s) => ({
      students: acc.students + s.studentCount,
      teachers: acc.teachers + s.teacherCount,
      courses: acc.courses + s.courseCount,
    }),
    { students: 0, teachers: 0, courses: 0 },
  )
}
