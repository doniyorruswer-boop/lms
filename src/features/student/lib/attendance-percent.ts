// Talabaning umumiy davomat foizini hisoblovchi toza (pure) funksiya (Req 3.1).
//
// Davomat tarixidagi yozuvlardan necha foizida talaba darsga kirgani
// (`checkInAt !== null`) hisoblanadi. Yozuvlar bo'sh bo'lsa 0 qaytariladi
// (nol bo'lishga bo'linish oldini olinadi). Natija doimo [0, 100] oralig'ida
// va butun songa yaxlitlangan bo'ladi.

import type { AttendanceRecord } from '@/shared/types'

/**
 * Davomat yozuvlari ro'yxatidan umumiy davomat foizini hisoblaydi.
 *
 * @param records - Talabaning davomat tarixi yozuvlari.
 * @returns 0 dan 100 gacha bo'lgan butun foiz; ro'yxat bo'sh bo'lsa 0.
 */
export function computeAttendancePercent(
  records: readonly AttendanceRecord[]
): number {
  if (records.length === 0) {
    return 0
  }
  const attended = records.filter((r) => r.checkInAt !== null).length
  return Math.round((attended / records.length) * 100)
}
