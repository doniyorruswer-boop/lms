// "Yangi dars" formasi uchun Zod sxemasi (Req 10.3, 10.6).
//
// Maydonlar: sarlavha, sana, davomiylik (daqiqa), video manbasi (URL) va PDF
// material havolasi. Xato xabarlari i18n kalitlari sifatida saqlanadi va UI da
// `t(...)` orqali tarjima qilinadi (Req 10.6).
//
// Video va PDF maydonlari ixtiyoriy: bo'sh string yoki to'g'ri URL qabul
// qilinadi. Davomiylik string kiritishdan musbat butun songa `coerce`
// qilinadi (RHF raqamli inputlardan string qaytaradi).

import { z } from 'zod'

/** Bo'sh string yoki to'g'ri URL ni qabul qiluvchi ixtiyoriy URL maydoni. */
const optionalUrl = (message: string) =>
  z.union([z.literal(''), z.string().url(message)])

/** "Yangi dars" formasi maydonlari validatsiyasi (Req 10.3, 10.6). */
export const lessonSchema = z.object({
  title: z.string().trim().min(1, 'teacher.lessonForm.errors.titleRequired'),
  date: z.string().min(1, 'teacher.lessonForm.errors.dateRequired'),
  durationMin: z.coerce
    .number({ invalid_type_error: 'teacher.lessonForm.errors.durationPositive' })
    .int('teacher.lessonForm.errors.durationPositive')
    .positive('teacher.lessonForm.errors.durationPositive'),
  videoUrl: optionalUrl('teacher.lessonForm.errors.videoUrlInvalid'),
  pdfUrl: optionalUrl('teacher.lessonForm.errors.pdfUrlInvalid'),
})

/** "Yangi dars" formasi qiymatlari turi. */
export type LessonFormValues = z.infer<typeof lessonSchema>
