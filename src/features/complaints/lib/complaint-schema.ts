// Shikoyat formasi uchun Zod sxema va validation (Req 15.1, 15.4)
//
// Bu modul shikoyat yaratish formasidagi maydonlarning validatsiya qoidalarini
// belgilaydi. `validateComplaintText` funksiyasi bilan integratsiya qilinadi.

import { z } from 'zod'
import { validateComplaintText } from './complaint-validation'

/** Shikoyat kategoriyalari */
export const COMPLAINT_CATEGORIES = [
  'technical',
  'content',
  'teacher',
  'assessment',
  'other'
] as const

export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number]

/** Ruxsat etilgan fayl turlari (biriktirmalar uchun) */
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'text/plain',
] as const

/** Maksimal fayl hajmi (5MB) */
const MAX_FILE_SIZE = 5 * 1024 * 1024

/** Maksimal fayllar soni */
const MAX_FILES_COUNT = 3

/**
 * Shikoyat formasi uchun Zod sxema.
 * 
 * Validatsiya qoidalari:
 * - category: majburiy, ruxsat etilgan kategoriyalardan biri
 * - courseId: ixtiyoriy string
 * - text: majburiy, kamida 20 ta belgi (validateComplaintText orqali)
 * - attachments: ixtiyoriy, maksimal 3 ta fayl, har biri 5MB gacha
 */
export const complaintFormSchema = z.object({
  category: z
    .enum(COMPLAINT_CATEGORIES)
    .refine((val) => COMPLAINT_CATEGORIES.includes(val), {
      message: 'complaints.form.validation.invalidCategory',
    }),
  
  courseId: z
    .string()
    .optional()
    .nullable(),
  
  text: z
    .string()
    .min(1, { message: 'complaints.form.validation.textRequired' })
    .refine((text) => {
      const result = validateComplaintText(text)
      return result.success
    }, {
      message: 'complaints.form.validation.textTooShort',
    }),
  
  attachments: z
    .array(z.instanceof(File))
    .max(MAX_FILES_COUNT, {
      message: 'complaints.form.validation.tooManyFiles',
    })
    .refine((files) => {
      // Har bir faylning hajmini tekshirish
      return files.every((file) => file.size <= MAX_FILE_SIZE)
    }, {
      message: 'complaints.form.validation.fileTooLarge',
    })
    .refine((files) => {
      // Har bir faylning turini tekshirish
      return files.every((file) => 
        ALLOWED_FILE_TYPES.includes(file.type as any)
      )
    }, {
      message: 'complaints.form.validation.invalidFileType',
    })
    .optional(),
})

export type ComplaintFormData = z.infer<typeof complaintFormSchema>

/** Fayl hajmini human-readable formatda ko'rsatish */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

/** Maksimal fayl hajmini export qilish */
export { MAX_FILE_SIZE, MAX_FILES_COUNT, ALLOWED_FILE_TYPES }