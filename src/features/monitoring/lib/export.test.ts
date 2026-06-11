// CSV/PDF eksport yordamchilari uchun unit testlar (Req 13.6).
import { describe, expect, it } from 'vitest'

import { toCsv, toSimplePdf } from './export'

describe('toCsv', () => {
  it('sarlavha va qatorlarni CRLF bilan birlashtiradi', () => {
    const csv = toCsv(['a', 'b'], [['1', '2'], ['3', '4']])
    expect(csv).toBe('a,b\r\n1,2\r\n3,4')
  })

  it('vergul, qo\'shtirnoq va yangi qatorni ekranlaydi', () => {
    const csv = toCsv(
      ['name', 'note'],
      [
        ['Toshkent, sh.', 'u "OTM"'],
        ['line1\nline2', 'ok'],
      ]
    )
    expect(csv).toBe(
      'name,note\r\n"Toshkent, sh.","u ""OTM"""\r\n"line1\nline2",ok'
    )
  })

  it('qo\'shtirnoqlarni ikkilantiradi', () => {
    expect(toCsv(['x'], [['a"b']])).toBe('x\r\n"a""b"')
  })

  it('oddiy qiymatlarni o\'zgartirmaydi', () => {
    expect(toCsv(['x'], [['plain']])).toBe('x\r\nplain')
  })

  it('bo\'sh qatorlar bilan faqat sarlavhani qaytaradi', () => {
    expect(toCsv(['x', 'y'], [])).toBe('x,y')
  })
})

describe('toSimplePdf', () => {
  it('yaroqli PDF sarlavhasi bilan boshlanadi va EOF bilan tugaydi', () => {
    const pdf = toSimplePdf('Title', ['line one', 'line two'])
    expect(pdf.startsWith('%PDF-1.4')).toBe(true)
    expect(pdf.trimEnd().endsWith('%%EOF')).toBe(true)
  })

  it('xref jadvali va trailer ni o\'z ichiga oladi', () => {
    const pdf = toSimplePdf('Hisobot', ['a'])
    expect(pdf).toContain('xref')
    expect(pdf).toContain('trailer')
    expect(pdf).toContain('/Root 1 0 R')
  })

  it('matnni PDF tarkibida saqlaydi', () => {
    const pdf = toSimplePdf('MyTitle', ['HelloWorld'])
    expect(pdf).toContain('(MyTitle) Tj')
    expect(pdf).toContain('(HelloWorld) Tj')
  })

  it('PDF maxsus belgilarini ekranlaydi', () => {
    const pdf = toSimplePdf('a(b)c\\d', [])
    expect(pdf).toContain('(a\\(b\\)c\\\\d) Tj')
  })

  it('ASCII bo\'lmagan belgilarni ? bilan almashtiradi', () => {
    const pdf = toSimplePdf('Тошкент', [])
    expect(pdf).toContain('(???????) Tj')
  })
})
