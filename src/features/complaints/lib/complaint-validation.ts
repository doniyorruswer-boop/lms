// Shikoyat matni validatsiyasi (Property 21, Requirement 15.4)

/** Shikoyat matni uchun minimal uzunlik (trim qilingan belgilar soni). */
export const COMPLAINT_TEXT_MIN_LENGTH = 20;

export type ComplaintTextValidationError = "min_length";

export type ComplaintTextValidationResult =
  | { success: true }
  | { success: false; error: ComplaintTextValidationError; minLength: number };

/**
 * Shikoyat matnini validatsiya qiladi.
 *
 * `success === true` qaytaradi if and only if `text.trim().length >= 20`.
 * Aks holda minimal uzunlik xatosi qaytariladi.
 */
export function validateComplaintText(text: string): ComplaintTextValidationResult {
  if (text.trim().length >= COMPLAINT_TEXT_MIN_LENGTH) {
    return { success: true };
  }

  return {
    success: false,
    error: "min_length",
    minLength: COMPLAINT_TEXT_MIN_LENGTH,
  };
}
