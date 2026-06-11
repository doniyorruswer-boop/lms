// event-mapper toza helper uchun unit testlar (Req 8.4).
import { describe, expect, it } from 'vitest'

import { classifyFaceDetection } from './classify'
import { faceResultToEventType, isViolation } from './event-mapper'

describe('faceResultToEventType', () => {
  it('face_ok ni "ok" ga aylantiradi', () => {
    expect(faceResultToEventType('face_ok')).toBe('ok')
  })

  it('face_missing ni "violation" ga aylantiradi', () => {
    expect(faceResultToEventType('face_missing')).toBe('violation')
  })

  it('multi_face ni "violation" ga aylantiradi', () => {
    expect(faceResultToEventType('multi_face')).toBe('violation')
  })
})

describe('isViolation', () => {
  it('faqat face_ok uchun false qaytaradi', () => {
    expect(isViolation('face_ok')).toBe(false)
    expect(isViolation('face_missing')).toBe(true)
    expect(isViolation('multi_face')).toBe(true)
  })
})

describe('classify → event-mapper integratsiyasi', () => {
  it('0 yuz → violation', () => {
    expect(faceResultToEventType(classifyFaceDetection([]))).toBe('violation')
  })

  it('1 yuz → ok', () => {
    expect(faceResultToEventType(classifyFaceDetection([{}]))).toBe('ok')
  })

  it('2 yuz → violation', () => {
    expect(faceResultToEventType(classifyFaceDetection([{}, {}]))).toBe(
      'violation',
    )
  })
})
