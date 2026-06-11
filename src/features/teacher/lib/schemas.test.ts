// Teacher feature Zod sxemalari uchun unit testlar (Req 10.3, 10.4, 10.5, 10.6).
import { describe, expect, it } from 'vitest'

import { assessmentSchema } from './assessment-schema'
import { createGradeSchema } from './grade-schema'
import { lessonSchema } from './lesson-schema'

describe('lessonSchema (Req 10.3, 10.6)', () => {
  it('to\'g\'ri dars ma\'lumotlarini qabul qiladi', () => {
    const result = lessonSchema.safeParse({
      title: '1-dars',
      date: '2024-03-15',
      durationMin: '90',
      videoUrl: 'https://example.com/v.m3u8',
      pdfUrl: '',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.durationMin).toBe(90)
    }
  })

  it('bo\'sh sarlavhada xato qaytaradi', () => {
    const result = lessonSchema.safeParse({
      title: '   ',
      date: '2024-03-15',
      durationMin: 30,
      videoUrl: '',
      pdfUrl: '',
    })
    expect(result.success).toBe(false)
  })

  it('manfiy davomiylikda xato qaytaradi', () => {
    const result = lessonSchema.safeParse({
      title: 'Dars',
      date: '2024-03-15',
      durationMin: -5,
      videoUrl: '',
      pdfUrl: '',
    })
    expect(result.success).toBe(false)
  })

  it('noto\'g\'ri video URL da xato qaytaradi', () => {
    const result = lessonSchema.safeParse({
      title: 'Dars',
      date: '2024-03-15',
      durationMin: 30,
      videoUrl: 'not-a-url',
      pdfUrl: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('assessmentSchema (Req 10.4, 10.6)', () => {
  const base = {
    title: 'Oraliq test',
    type: 'TEST' as const,
    timerMinutes: 45,
    proctoringRequired: true,
    questions: [{ text: '2+2=?', points: 5 }],
  }

  it('to\'g\'ri baholash ma\'lumotlarini qabul qiladi', () => {
    expect(assessmentSchema.safeParse(base).success).toBe(true)
  })

  it('savol bo\'lmaganda xato qaytaradi', () => {
    const result = assessmentSchema.safeParse({ ...base, questions: [] })
    expect(result.success).toBe(false)
  })

  it('savol matni bo\'sh bo\'lganda xato qaytaradi', () => {
    const result = assessmentSchema.safeParse({
      ...base,
      questions: [{ text: '', points: 1 }],
    })
    expect(result.success).toBe(false)
  })

  it('manfiy taymerga xato qaytaradi', () => {
    const result = assessmentSchema.safeParse({ ...base, timerMinutes: 0 })
    expect(result.success).toBe(false)
  })
})

describe('createGradeSchema (Req 10.5)', () => {
  it('ball [0, maxPoints] oralig\'ida bo\'lsa qabul qiladi', () => {
    const schema = createGradeSchema(10)
    expect(schema.safeParse({ score: 0, comment: '' }).success).toBe(true)
    expect(schema.safeParse({ score: 10, comment: 'Yaxshi' }).success).toBe(true)
  })

  it('ball maxPoints dan oshsa xato qaytaradi', () => {
    const schema = createGradeSchema(10)
    expect(schema.safeParse({ score: 11 }).success).toBe(false)
  })

  it('manfiy ballga xato qaytaradi', () => {
    const schema = createGradeSchema(10)
    expect(schema.safeParse({ score: -1 }).success).toBe(false)
  })
})
