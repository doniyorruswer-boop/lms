// Smoke test — test infratuzilmasi (Vitest + RTL + fast-check + MSW + jest-axe)
// to'g'ri o'rnatilganini tasdiqlaydi.
// _Requirements: 20.1 (test asosi)_
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { http, HttpResponse } from 'msw'
import fc from 'fast-check'
import { server } from './msw/server'
import { API_PREFIX } from './msw/handlers'
import {
  DIRECTIONS,
  ROLES,
  arbCapacity,
  arbCourse,
  arbDirection,
  arbPath,
  arbProctoringFaces,
  arbRole,
  arbTimestampStream,
  arbToken,
} from './generators'

describe('test infratuzilmasi (smoke)', () => {
  it('Vitest + jsdom ishlaydi', () => {
    expect(1 + 1).toBe(2)
    expect(typeof document).toBe('object')
    expect(typeof window).toBe('object')
  })

  it('React Testing Library render qiladi', () => {
    render(<button type="button">Salom</button>)
    expect(screen.getByRole('button', { name: 'Salom' })).toBeInTheDocument()
  })

  it('jest-axe a11y tekshiruvi ishlaydi', async () => {
    const { container } = render(
      <main>
        <h1>Sarlavha</h1>
        <button type="button">Bosing</button>
      </main>,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('MSW server so\'rovni ushlab javob qaytaradi', async () => {
    // Relyativ URL jsdom origin (handlerlar ham shu origin ga resolve bo'ladi)
    // bo'yicha hal qilinadi, shuning uchun `/api/v1/health` handleriga mos keladi.
    const res = await fetch(`${API_PREFIX}/health`)
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ status: 'ok' })
  })

  it('MSW per-test override (server.use) ishlaydi', async () => {
    server.use(
      http.get(`${API_PREFIX}/ping`, () =>
        HttpResponse.json({ pong: true }),
      ),
    )
    const res = await fetch(`${API_PREFIX}/ping`)
    await expect(res.json()).resolves.toEqual({ pong: true })
  })

  describe('fast-check generatorlari', () => {
    it('arbRole faqat ma\'lum rollarni beradi', () => {
      fc.assert(
        fc.property(arbRole, (role) => {
          expect(ROLES).toContain(role)
        }),
      )
    })

    it('arbDirection BACHELOR yoki MASTER', () => {
      fc.assert(
        fc.property(arbDirection, (d) => {
          expect(DIRECTIONS).toContain(d)
        }),
      )
    })

    it('arbCapacity musbat butun son', () => {
      fc.assert(
        fc.property(arbCapacity, (c) => {
          expect(Number.isInteger(c)).toBe(true)
          expect(c).toBeGreaterThanOrEqual(1)
        }),
      )
    })

    it('arbCourse to\'g\'ri shaklga ega va enrolledCount ≤ capacity', () => {
      fc.assert(
        fc.property(arbCourse, (course) => {
          expect(DIRECTIONS).toContain(course.direction)
          expect(course.progressPercent).toBeGreaterThanOrEqual(0)
          expect(course.progressPercent).toBeLessThanOrEqual(100)
          expect(course.enrolledCount).toBeLessThanOrEqual(course.capacity)
        }),
      )
    })

    it('arbPath "/" bilan boshlanadi', () => {
      fc.assert(
        fc.property(arbPath, (p) => {
          expect(p.startsWith('/')).toBe(true)
        }),
      )
    })

    it('arbToken uch bo\'lakli format beradi', () => {
      fc.assert(
        fc.property(arbToken, (t) => {
          expect(t.split('.')).toHaveLength(3)
        }),
      )
    })

    it('arbProctoringFaces manfiy bo\'lmagan butun sonlar massivi', () => {
      fc.assert(
        fc.property(arbProctoringFaces, (faces) => {
          expect(Array.isArray(faces)).toBe(true)
          faces.forEach((n) => {
            expect(Number.isInteger(n)).toBe(true)
            expect(n).toBeGreaterThanOrEqual(0)
          })
        }),
      )
    })

    it('arbTimestampStream qat\'iy o\'suvchi oqim beradi', () => {
      fc.assert(
        fc.property(arbTimestampStream, (stream) => {
          for (let i = 1; i < stream.length; i++) {
            expect(stream[i]!).toBeGreaterThan(stream[i - 1]!)
          }
        }),
      )
    })
  })
})
