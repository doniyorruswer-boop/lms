// `isLessonStarted` uchun unit testlar (Req 9.1).
import { describe, expect, it } from 'vitest'

import { isLessonStarted } from './lesson-timing'

describe('isLessonStarted', () => {
  const start = '2024-03-15T09:00:00.000Z'
  const startMs = Date.parse(start)

  it('dars boshlanganidan keyin true qaytaradi', () => {
    expect(isLessonStarted(start, startMs + 1)).toBe(true)
    expect(isLessonStarted(start, startMs + 60_000)).toBe(true)
  })

  it('aniq boshlanish lahzasida true qaytaradi (now === start)', () => {
    expect(isLessonStarted(start, startMs)).toBe(true)
  })

  it('dars boshlanishidan oldin false qaytaradi', () => {
    expect(isLessonStarted(start, startMs - 1)).toBe(false)
    expect(isLessonStarted(start, startMs - 60_000)).toBe(false)
  })

  it('yaroqsiz sana satrida false qaytaradi', () => {
    expect(isLessonStarted('not-a-date', Date.now())).toBe(false)
    expect(isLessonStarted('', Date.now())).toBe(false)
  })
})
