import { z } from "zod";
import type { DirectionType } from "@/shared/types";

/**
 * Kontingent (kurs sig'imi) chegaralari — O'zbekiston VM 559-son qarori, 20-band.
 *
 * - BACHELOR (Bakalavriat): maksimal 300 talaba.
 * - MASTER (Magistratura): maksimal 30 talaba.
 */
export const CONTINGENT_LIMITS: Record<DirectionType, number> = {
  BACHELOR: 300,
  MASTER: 30,
};

/**
 * O'zbekiston VM 559-son qarori, 20-band matnining rasmiy havolasi.
 * Kontingent chegarasidan oshib ketganda foydalanuvchiga ko'rsatiladi (Req 11.6).
 */
export const RESOLUTION_559_CLAUSE_20_URL = "https://lex.uz/docs/6238631";

/**
 * Kontingent chegarasidan oshib ketganda ko'rsatiladigan xato xabari.
 * 559-son qarorning 20-bandiga havola qiladi (Req 11.6).
 */
export function contingentLimitMessage(direction: DirectionType): string {
  return (
    `Kurs sig'imi ${CONTINGENT_LIMITS[direction]} dan oshmasligi kerak ` +
    `(559-son qaror, 20-band).`
  );
}

/**
 * Kurs yaratish/tahrirlash formasi uchun Zod sxemasi.
 *
 * `capacity` maydoni `direction` ga bog'liq holda validatsiya qilinadi:
 *   - BACHELOR && capacity <= 300  → muvaffaqiyat
 *   - MASTER   && capacity <= 30   → muvaffaqiyat
 * Aks holda `capacity` maydoni uchun 559-son qaror, 20-bandiga havola
 * bilan xato qaytariladi (Req 11.4, 11.5, 11.6).
 *
 * Validates: Property 18 (Kurs sig'imi yo'nalish bo'yicha validatsiyasi).
 */
export const courseSchema = z
  .object({
    title: z.string().min(1, "Kurs nomi majburiy"),
    direction: z.enum(["BACHELOR", "MASTER"]),
    semester: z.number().int().positive(),
    teacherName: z.string().min(1, "O'qituvchi ismi majburiy"),
    capacity: z.number().int().positive("Sig'im musbat butun son bo'lishi kerak"),
  })
  .superRefine((data, ctx) => {
    const limit = CONTINGENT_LIMITS[data.direction];
    if (data.capacity > limit) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["capacity"],
        message: contingentLimitMessage(data.direction),
      });
    }
  });

export type CourseFormValues = z.infer<typeof courseSchema>;

/**
 * Shikoyat (complaint/feedback) matni minimal uzunligi.
 * Nizom 32-bandiga muvofiq kamida 20 belgi talab qilinadi (Req 15.4).
 */
export const COMPLAINT_MIN_LENGTH = 20;

/**
 * Shikoyat formasi uchun Zod sxemasi.
 * 
 * `text` maydoni kamida 20 belgi bo'lishi kerak (trim qilinganidan keyin).
 * `category` va `text` majburiy, `courseId` va `attachments` ixtiyoriy.
 * 
 * Validates: Property 21 (Shikoyat matni uzunligini validatsiyasi).
 */
export const feedbackSchema = z.object({
  category: z.string().min(1, "Shikoyat turi majburiy"),
  courseId: z.string().optional(),
  text: z
    .string()
    .min(1, "Shikoyat matni majburiy")
    .refine(
      (text) => text.trim().length >= COMPLAINT_MIN_LENGTH,
      {
        message: `Shikoyat matni kamida ${COMPLAINT_MIN_LENGTH} belgi bo'lishi kerak`,
      }
    ),
  attachments: z.array(z.instanceof(File)).optional(),
});

export type FeedbackFormValues = z.infer<typeof feedbackSchema>;
