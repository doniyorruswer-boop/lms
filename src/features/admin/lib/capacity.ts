// Kurs sig'imi (kontingent) vizual indikatori uchun toza yordamchi (Req 11.4–11.6).
//
// Kurs yaratish formasida tanlangan yo'nalishga qarab sig'im chegarasini va
// to'ldirilish foizini hisoblaydi. Haqiqiy validatsiya (yuborishni bloklash)
// `courseSchema` orqali amalga oshiriladi; bu funksiya faqat UI indikatori
// uchun (progress bar kengligi va "oshib ketdi" holati) ma'lumot beradi.
//
// Side-effect siz va toza — shu sababli alohida unit test bilan qoplanadi.

import { CONTINGENT_LIMITS } from '@/shared/lib/validation'
import type { DirectionType } from '@/shared/types'

/** Sig'im ogohlantirishining chegarasi (0.8 = 80%). */
export const CAPACITY_WARNING_RATIO = 0.8

/** Sig'im indikatorining darajasi. */
export type CapacityLevel = 'ok' | 'warning' | 'exceeded'

/** Sig'im indikatorining hisoblangan holati. */
export interface CapacityStatus {
  /** Tanlangan yo'nalish uchun maksimal sig'im (BACHELOR=300, MASTER=30). */
  limit: number
  /** To'ldirilish foizi, `[0, 100]` oralig'ida cheklangan. */
  percent: number
  /** To'ldirilish nisbati, `[0, 1+]` oralig'ida. */
  ratio: number
  /** Sig'im darajasi (ok/warning/exceeded). */
  level: CapacityLevel
  /** `capacity` chegaradan oshib ketganmi (yuborish bloklanadi). */
  exceeded: boolean
}

/**
 * Berilgan yo'nalish va sig'im uchun indikator holatini hisoblaydi.
 *
 * - `limit` — yo'nalishga mos kontingent chegarasi (559-son qaror, 20-band).
 * - `percent` — `capacity / limit * 100`, `[0, 100]` ga cheklanadi (bar hech
 *   qachon to'lib-toshmaydi).
 * - `exceeded` — `capacity > limit` bo'lsa `true`.
 *
 * Manfiy, NaN yoki cheksiz `capacity` qiymatlari `0` deb qabul qilinadi, shunda
 * indikator hech qachon `NaN` kenglik bilan render qilinmaydi.
 */
export function capacityStatus(
  direction: DirectionType,
  capacity: number,
): CapacityStatus {
  const limit = CONTINGENT_LIMITS[direction]
  const safeCapacity =
    Number.isFinite(capacity) && capacity > 0 ? capacity : 0
  const exceeded = safeCapacity > limit
  const ratio = safeCapacity / limit
  const percent = Math.min(Math.max(ratio * 100, 0), 100)
  
  let level: CapacityLevel
  if (exceeded) {
    level = 'exceeded'
  } else if (ratio >= CAPACITY_WARNING_RATIO) {
    level = 'warning'
  } else {
    level = 'ok'
  }
  
  return { limit, percent, ratio, level, exceeded }
}
