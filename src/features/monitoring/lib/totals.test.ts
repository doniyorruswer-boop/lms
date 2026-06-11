// `computeIndicatorTotals` uchun unit testlar (Req 13.1).
import { describe, expect, it } from 'vitest'

import type { OtmStats } from '@/shared/types'

import { computeIndicatorTotals } from './totals'

function makeStat(partial: Partial<OtmStats>): OtmStats {
  return {
    otmId: 'otm-1',
    otmName: 'OTM',
    studentCount: 0,
    teacherCount: 0,
    courseCount: 0,
    ratio: 0,
    ...partial,
  }
}

describe('computeIndicatorTotals', () => {
  it('bo\'sh ro\'yxat uchun barcha qiymatlar nol', () => {
    expect(computeIndicatorTotals([])).toEqual({
      totalStudents: 0,
      totalTeachers: 0,
      totalCourses: 0,
      otmCount: 0,
    })
  })

  it('bir nechta OTM bo\'yicha sonlarni yig\'adi', () => {
    const stats = [
      makeStat({ studentCount: 100, teacherCount: 5, courseCount: 10 }),
      makeStat({ studentCount: 250, teacherCount: 4, courseCount: 20 }),
      makeStat({ studentCount: 50, teacherCount: 1, courseCount: 3 }),
    ]

    expect(computeIndicatorTotals(stats)).toEqual({
      totalStudents: 400,
      totalTeachers: 10,
      totalCourses: 33,
      otmCount: 3,
    })
  })

  it('bitta OTM uchun aynan o\'sha qiymatlarni qaytaradi', () => {
    const stats = [makeStat({ studentCount: 7, teacherCount: 2, courseCount: 4 })]
    expect(computeIndicatorTotals(stats)).toEqual({
      totalStudents: 7,
      totalTeachers: 2,
      totalCourses: 4,
      otmCount: 1,
    })
  })
})
