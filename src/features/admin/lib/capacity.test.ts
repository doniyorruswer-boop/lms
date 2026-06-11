// `capacityStatus` toza yordamchisi uchun unit testlar (Req 11.4, 11.5).
import { describe, expect, it } from 'vitest'

import { capacityStatus } from './capacity'

describe('capacityStatus', () => {
  it('BACHELOR uchun chegara 300 ni qaytaradi', () => {
    expect(capacityStatus('BACHELOR', 150).limit).toBe(300)
  })

  it('MASTER uchun chegara 30 ni qaytaradi', () => {
    expect(capacityStatus('MASTER', 10).limit).toBe(30)
  })

  it('chegara ichida exceeded=false va to`g`ri foiz qaytaradi', () => {
    const status = capacityStatus('BACHELOR', 150)
    expect(status.exceeded).toBe(false)
    expect(status.percent).toBe(50)
  })

  it('chegarada (teng) exceeded=false va 100% qaytaradi', () => {
    const status = capacityStatus('MASTER', 30)
    expect(status.exceeded).toBe(false)
    expect(status.percent).toBe(100)
  })

  it('BACHELOR 300 dan oshganda exceeded=true (Req 11.4)', () => {
    expect(capacityStatus('BACHELOR', 301).exceeded).toBe(true)
  })

  it('MASTER 30 dan oshganda exceeded=true (Req 11.5)', () => {
    expect(capacityStatus('MASTER', 31).exceeded).toBe(true)
  })

  it('foiz [0, 100] oralig`ida cheklanadi (oshganda ham 100 dan oshmaydi)', () => {
    const status = capacityStatus('MASTER', 600)
    expect(status.percent).toBe(100)
    expect(status.exceeded).toBe(true)
  })

  it('NaN yoki manfiy sig`im 0 ga normallashtiriladi', () => {
    expect(capacityStatus('BACHELOR', Number.NaN).percent).toBe(0)
    expect(capacityStatus('BACHELOR', -5).percent).toBe(0)
    expect(capacityStatus('BACHELOR', -5).exceeded).toBe(false)
  })
})
