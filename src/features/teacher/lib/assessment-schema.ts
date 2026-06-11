// "Yangi baholash" formasi uchun Zod sxemasi (Req 10.4, 10.6).
//
// Maydonlar: baholash turi (test/topshiriq), savollar (matn + ball), taymer
// (daqiqa) va proktoring talab qilinishi. Xato xabarlari i18n kalitlari
// sifatida saqlanadi va UI da `t(...)` orqali tarjima qilinadi (Req 10.6).
//
// Raqamli maydonlar (ball, taymer) string kiritishdan `coerce` qilinadi
// (RHF raqamli inputlardan string qaytaradi). Kamida bitta savol talab
// qilinadi.

import { z } from 'zod'

/** Bitta savol uchun validatsiya: matn va musbat butun ball. */
export const assessmentQuestionSchema = z.object({
  text: z.string().trim().min(1, 'teacher.assessmentForm.errors.questionRequired'),
  points: z.coerce
    .number({ invalid_type_error: 'teacher.assessmentForm.errors.pointsPositive' })
    .int('teacher.assessmentForm.errors.pointsPositive')
    .positive('teacher.assessmentForm.errors.pointsPositive'),
})

/** "Yangi baholash" formasi maydonlari validatsiyasi (Req 10.4, 10.6). */
export const assessmentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'teacher.assessmentForm.errors.titleRequired'),
  type: z.enum(['TEST', 'ASSIGNMENT']),
  timerMinutes: z.coerce
    .number({ invalid_type_error: 'teacher.assessmentForm.errors.timerPositive' })
    .int('teacher.assessmentForm.errors.timerPositive')
    .positive('teacher.assessmentForm.errors.timerPositive'),
  proctoringRequired: z.boolean(),
  questions: z
    .array(assessmentQuestionSchema)
    .min(1, 'teacher.assessmentForm.errors.questionsRequired'),
})

/** "Yangi baholash" formasi qiymatlari turi. */
export type AssessmentFormValues = z.infer<typeof assessmentSchema>
