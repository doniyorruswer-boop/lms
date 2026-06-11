// Talaba ishini baholash formasi uchun Zod sxemasi (Req 10.5).
//
// Maydonlar: ball (score) va izoh (comment). Ball [0, maxPoints] oraliqda
// bo'lishi kerak — chegara ishning maksimal ballidan kelib chiqadi, shu
// sababli sxema fabrika (factory) funksiyasi orqali yaratiladi. Izoh
// ixtiyoriy. Xato xabarlari i18n kalitlari sifatida saqlanadi.

import { z } from 'zod'

/**
 * Berilgan maksimal ballga moslangan baholash sxemasini yaratadi (Req 10.5).
 *
 * Ball `coerce` qilinadi (RHF raqamli inputdan string qaytaradi) va
 * `[0, maxPoints]` oraliqda bo'lishi shart.
 *
 * @param maxPoints Ushbu ish uchun maksimal ball.
 */
export function createGradeSchema(maxPoints: number) {
  return z.object({
    score: z.coerce
      .number({ invalid_type_error: 'teacher.grading.errors.scoreInvalid' })
      .min(0, 'teacher.grading.errors.scoreRange')
      .max(maxPoints, 'teacher.grading.errors.scoreRange'),
    comment: z.string().trim().optional(),
  })
}

/** Baholash formasi qiymatlari turi. */
export type GradeFormValues = z.infer<ReturnType<typeof createGradeSchema>>
