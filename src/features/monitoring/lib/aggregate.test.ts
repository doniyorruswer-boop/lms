// Indikator totals agregatsiyasi uchun unit testlar (Req 13.1).
import { describe, expect, it } from 'vitest'

import type { OtmStats } from '@/shared/types'

import { computeIndicatorTotals } from './aggregate'

const stats: OtmStats[] = [
  {
    otmId: 'a',
    otmName: 'OTM A',
    studentCount: 300,
    teacherCount: 5,
    courseCount: 10,
    ratio: 60,
  },
  {
    otmId: 'b',
    otmName: 'OTM B',
    studentCount: 40,
    teacherCount: 2,
    courseCount: 5,
    ratio: 20,
  },
]

describe('computeIndicatorTotals', () => {
  it('barcha OTM bo\'yicha sonlarni yig\'adi', () => {
    expect(computeIndicatorTotals(stats)).toEqual({
      students: 340,
      teachers: 7,
      courses: 15,
    })
  })

  it('bo\'sh ro\'yxat uchun nollarni qaytaradi', () => {
    expect(computeIndicatorTotals([])).toEqual({
      students: 0,
      teachers: 0,
      courses: 0,
    })
  })
})
