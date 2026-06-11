// Davomat jadvallarida vaqt/sana ko'rsatish uchun toza yordamchilar (Req 9.4, 9.5).
//
// Backend ISO 8601 satrlarini qaytaradi; bu yordamchilar ularni foydalanuvchi
// uchun o'qiladigan ko'rinishga aylantiradi. `null` (hali kirilmagan/chiqilmagan)
// holatda bo'sh joy ko'rsatkichi (`—`) qaytariladi.

/** `null`/yaroqsiz qiymatlar uchun ko'rsatiladigan joy belgisi. */
export const EMPTY_PLACEHOLDER = '—'

/**
 * ISO 8601 satridan soat:daqiqa ko'rinishini qaytaradi (mas. "09:05").
 *
 * @param iso ISO 8601 satr yoki `null`.
 * @returns Mahalliy vaqt `HH:mm` formatida yoki `null`/yaroqsiz bo'lsa `—`.
 */
export function formatClockTime(iso: string | null): string {
  if (!iso) {
    return EMPTY_PLACEHOLDER
  }
  const ms = Date.parse(iso)
  if (Number.isNaN(ms)) {
    return EMPTY_PLACEHOLDER
  }
  const date = new Date(ms)
  const hh = date.getHours().toString().padStart(2, '0')
  const mm = date.getMinutes().toString().padStart(2, '0')
  return `${hh}:${mm}`
}

/**
 * ISO 8601 satridan sana ko'rinishini qaytaradi (mas. "2024-03-15").
 *
 * @param iso ISO 8601 satr yoki `null`.
 * @returns Sana `YYYY-MM-DD` formatida yoki `null`/yaroqsiz bo'lsa `—`.
 */
export function formatDate(iso: string | null): string {
  if (!iso) {
    return EMPTY_PLACEHOLDER
  }
  const ms = Date.parse(iso)
  if (Number.isNaN(ms)) {
    return EMPTY_PLACEHOLDER
  }
  const date = new Date(ms)
  const yyyy = date.getFullYear().toString().padStart(4, '0')
  const mo = (date.getMonth() + 1).toString().padStart(2, '0')
  const dd = date.getDate().toString().padStart(2, '0')
  return `${yyyy}-${mo}-${dd}`
}
