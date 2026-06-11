// `formatClockTime` va `formatDate` uchun unit testlar (Req 9.4, 9.5).
import { describe, expect, it } from 'vitest'

import { EMPTY_PLACEHOLDER, formatClockTime, formatDate } from './format-time'

describe('formatClockTime', () => {
  it('null uchun joy belgisini qaytaradi', () => {
    expect(formatClockTime(null)).toBe(EMPTY_PLACEHOLDER)
  })

  it('yaroqsiz satr uchun joy belgisini qaytaradi', () => {
    expect(formatClockTime('garbage')).toBe(EMPTY_PLACEHOLDER)
  })

  it('yaroqli ISO satr uchun HH:mm formatini qaytaradi', () => {
    // Mahalliy vaqt zonasiga bog'liq bo'lmaslik uchun aniq vaqt o'rniga
    // format shaklini tekshiramiz: ikki raqam, ikki nuqta, ikki raqam.
    const result = formatClockTime('2024-03-15T09:05:00.000Z')
    expect(result).toMatch(/^\d{2}:\d{2}$/)
  })
})

describe('formatDate', () => {
  it('null uchun joy belgisini qaytaradi', () => {
    expect(formatDate(null)).toBe(EMPTY_PLACEHOLDER)
  })

  it('yaroqsiz satr uchun joy belgisini qaytaradi', () => {
    expect(formatDate('garbage')).toBe(EMPTY_PLACEHOLDER)
  })

  it('yaroqli ISO satr uchun YYYY-MM-DD formatini qaytaradi', () => {
    const result = formatDate('2024-03-15T09:05:00.000Z')
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
