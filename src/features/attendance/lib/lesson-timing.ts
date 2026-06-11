// Dars vaqti boshlanganligini aniqlovchi toza (pure) yordamchi (Req 9.1).
//
// "Darsga kirdim" tugmasi faqat dars vaqti boshlangach faollashishi kerak
// (Req 9.1). Bu funksiya side-effect siz bo'lib, joriy vaqtni (`now`)
// parametr sifatida qabul qiladi — shu sababli osongina test qilinadi.

/**
 * Dars boshlanish vaqti (ISO 8601) hozirgi vaqtdan o'tgan-o'tmaganini
 * aniqlaydi.
 *
 * @param lessonStartAtIso Dars boshlanish vaqti, ISO 8601 satr.
 * @param now              Joriy vaqt (epoch ms). Odatda `Date.now()`.
 * @returns `true` — agar dars allaqachon boshlangan bo'lsa (now ≥ start).
 *          Yaroqsiz sana berilsa `false` qaytariladi (tugma faollashmaydi).
 */
export function isLessonStarted(
  lessonStartAtIso: string,
  now: number,
): boolean {
  const startMs = Date.parse(lessonStartAtIso)
  if (Number.isNaN(startMs)) {
    return false
  }
  return now >= startMs
}
