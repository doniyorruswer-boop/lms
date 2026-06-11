// Umumiy fast-check generatorlari (arbitraries) — PBT sub-vazifalari shu yerdan
// foydalanadi. Tiplar `src/shared/types` hali aniqlanmagan bo'lishi mumkin
// (task 2.1), shuning uchun generatorlar self-contained: zarur tip literallari
// shu yerda inline e'lon qilinadi va keyinroq haqiqiy tiplar bilan moslashadi.
import fc from 'fast-check'

// ---- Inline tip literallari (design.md Data Models bilan mos) ----

/** Tizimdagi barcha rollar (design.md Data Models: `Role`). */
export const ROLES = [
  'SUPER_ADMIN',
  'OTM_ADMIN',
  'DEKAN',
  'TEACHER',
  'STUDENT',
] as const

export type Role = (typeof ROLES)[number]

/** Ta'lim yo'nalishi turlari (design.md: `DirectionType`). */
export const DIRECTIONS = ['BACHELOR', 'MASTER'] as const

export type DirectionType = (typeof DIRECTIONS)[number]

export interface CourseLike {
  id: string
  title: string
  teacherName: string
  direction: DirectionType
  semester: number
  capacity: number
  enrolledCount: number
  progressPercent: number
}

// ---- Asosiy generatorlar ----

/** Tizimdagi barcha rollardan biri. */
export const arbRole: fc.Arbitrary<Role> = fc.constantFrom(...ROLES)

/** Ta'lim yo'nalishi turi. */
export const arbDirection: fc.Arbitrary<DirectionType> =
  fc.constantFrom(...DIRECTIONS)

/**
 * Kurs sig'imi (kontingent). Validatsiya chegaralarining ikkala tomonini
 * (qonuniy va oshib ketgan) qamrab olish uchun 1..400 oralig'i tanlangan
 * (Bachelor ≤ 300, Master ≤ 30).
 */
export const arbCapacity: fc.Arbitrary<number> = fc.integer({ min: 1, max: 400 })

/** To'liq Course-ga o'xshash obyekt. */
export const arbCourse: fc.Arbitrary<CourseLike> = fc
  .record({
    id: fc.uuid(),
    title: fc.string({ minLength: 1, maxLength: 80 }),
    teacherName: fc.string({ minLength: 1, maxLength: 60 }),
    direction: arbDirection,
    semester: fc.integer({ min: 1, max: 8 }),
    capacity: arbCapacity,
    enrolledCount: fc.nat({ max: 400 }),
    progressPercent: fc.integer({ min: 0, max: 100 }),
  })
  .map((c) => ({
    ...c,
    // enrolled hech qachon capacity dan oshmasligi mantiqan to'g'ri.
    enrolledCount: Math.min(c.enrolledCount, c.capacity),
  }))

/**
 * Marshrut yo'li (pathname). RBAC/redirect testlari uchun ham ma'lum panel
 * yo'llari, ham tasodifiy chuqurroq yo'llar generatsiya qilinadi.
 */
export const arbPath: fc.Arbitrary<string> = fc.oneof(
  fc.constantFrom(
    '/login',
    '/forbidden',
    '/student/dashboard',
    '/student/courses',
    '/teacher/dashboard',
    '/admin/dashboard',
    '/admin/users',
    '/monitoring/dashboard',
    '/reports',
  ),
  fc
    .array(
      fc
        .string({ minLength: 1, maxLength: 12 })
        .filter((s) => /^[a-zA-Z0-9_-]+$/.test(s)),
      { minLength: 1, maxLength: 4 },
    )
    .map((segs) => '/' + segs.join('/')),
)

/**
 * JWT-ga o'xshash token satri. Format `header.payload.signature` bo'lib,
 * har bo'lak bo'sh bo'lmagan base64url-ga o'xshash belgilardan iborat.
 */
export const arbToken: fc.Arbitrary<string> = fc
  .tuple(
    fc.string({ minLength: 1, maxLength: 24 }),
    fc.string({ minLength: 1, maxLength: 48 }),
    fc.string({ minLength: 1, maxLength: 24 }),
  )
  .map(([h, p, s]) => {
    const enc = (x: string) =>
      btoa(x).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_') || 'x'
    return `${enc(h)}.${enc(p)}.${enc(s)}`
  })

/**
 * Proktoring kadrida aniqlangan yuzlar soni ketma-ketligi. Har bir element
 * aniqlash natijasidagi yuzlar soni (0 = yo'q, 1 = ok, ≥2 = ko'p yuz).
 */
export const arbProctoringFaces: fc.Arbitrary<number[]> = fc.array(
  fc.integer({ min: 0, max: 5 }),
  { minLength: 0, maxLength: 50 },
)

/**
 * Qat'iy o'suvchi epoch-ms timestamp oqimi. throttle/debounce/backoff kabi
 * vaqtga bog'liq logikani test qilish uchun foydalaniladi.
 */
export const arbTimestampStream: fc.Arbitrary<number[]> = fc
  .tuple(
    fc.integer({ min: 0, max: 1_000_000 }),
    fc.array(fc.integer({ min: 1, max: 60_000 }), {
      minLength: 0,
      maxLength: 50,
    }),
  )
  .map(([start, deltas]) => {
    const stream: number[] = []
    let t = start
    for (const d of deltas) {
      t += d
      stream.push(t)
    }
    return stream
  })
