// CSV serializatsiya yordamchilari uchun unit testlar (Req 13.6).
import { describe, expect, it } from 'vitest'

import type { ContingentStat, OtmStats } from '@/shared/types'

import {
  buildContingentCsv,
  buildCsv,
  buildOtmStatsCsv,
  escapeCsvField,
} from './csv'

describe('escapeCsvField', () => {
  it('oddiy qiymatlarni o\'zgartirmaydi', () => {
    expect(escapeCsvField('OTM')).toBe('OTM')
    expect(escapeCsvField(42)).toBe('42')
  })

  it('vergul mavjud bo\'lganda qo\'shtirnoq bilan o\'raydi', () => {
    expect(escapeCsvField('Toshkent, OTM')).toBe('"Toshkent, OTM"')
  })

  it('ichki qo\'shtirnoqlarni ikkilantiradi', () => {
    expect(escapeCsvField('A "B" C')).toBe('"A ""B"" C"')
  })

  it('yangi qator mavjud bo\'lganda o\'raydi', () => {
    expect(escapeCsvField('A\nB')).toBe('"A\nB"')
  })
})

describe('buildCsv', () => {
  it('sarlavha va qatorlarni CRLF bilan birlashtiradi', () => {
    const csv = buildCsv(
      ['a', 'b'],
      [
        [1, 2],
        [3, 4],
      ],
    )
    expect(csv).toBe('a,b\r\n1,2\r\n3,4')
  })

  it('faqat sarlavhani qaytaradi (bo\'sh qatorlar)', () => {
    expect(buildCsv(['a', 'b'], [])).toBe('a,b')
  })
})

describe('buildOtmStatsCsv', () => {
  it('OTM statistikasini to\'g\'ri ustunlar bilan seriyalaydi', () => {
    const stats: OtmStats[] = [
      {
        otmId: 'a',
        otmName: 'OTM A',
        studentCount: 300,
        teacherCount: 5,
        courseCount: 10,
        ratio: 60,
      },
    ]
    const csv = buildOtmStatsCsv(stats, [
      'OTM',
      'Talabalar',
      "O'qituvchilar",
      'Kurslar',
      'Nisbat',
    ])
    expect(csv).toBe(
      "OTM,Talabalar,O'qituvchilar,Kurslar,Nisbat\r\nOTM A,300,5,10,60",
    )
  })
})

describe('buildContingentCsv', () => {
  it('kontingent statistikasini seriyalaydi', () => {
    const stats: ContingentStat[] = [
      { otmId: 'a', otmName: 'OTM A', bachelorCount: 250, masterCount: 50 },
    ]
    const csv = buildContingentCsv(stats, ['OTM', 'Bakalavr', 'Magistr'])
    expect(csv).toBe('OTM,Bakalavr,Magistr\r\nOTM A,250,50')
  })
})
