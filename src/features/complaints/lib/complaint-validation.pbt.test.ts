// Property-based test for complaint text validation (Property 21, Task 7.8)
//
// **Property 21: Shikoyat matni uzunligini validatsiyasi**
// **Validates: Requirements 15.4**
//
// Bu test validateComplaintText funksiyasining quyidagi xususiyatlarini tekshiradi:
// 1. text.trim().length >= 20 bo'lsa, success: true qaytarishi
// 2. text.trim().length < 20 bo'lsa, success: false va error: "min_length" qaytarishi
// 3. Oq bo'shliqlar (probel, tab, yangi qator) to'g'ri trim qilinishi

import { describe, it, expect } from 'vitest'
import { fc } from '@fast-check/vitest'

import { validateComplaintText, COMPLAINT_TEXT_MIN_LENGTH } from './complaint-validation'

describe('Property 21: Shikoyat matni uzunligini validatsiyasi', () => {
  it('should return success for text with 20 or more characters after trimming', () => {
    fc.assert(
      fc.property(
        // Kamida 20 ta belgi bo'lgan matnlar uchun
        fc.string({ minLength: COMPLAINT_TEXT_MIN_LENGTH }),
        fc.string(), // Bo'shliqlar uchun prefix
        fc.string(), // Bo'shliqlar uchun suffix
        (validText, prefix, suffix) => {
          // Oldi va oxiriga bo'shliqlar qo'shamiz
          const textWithWhitespace = prefix + validText + suffix
          const result = validateComplaintText(textWithWhitespace)
          
          expect(result.success).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return error for text with less than 20 characters after trimming', () => {
    fc.assert(
      fc.property(
        // 20 dan kam belgi bo'lgan matnlar uchun
        fc.string({ maxLength: COMPLAINT_TEXT_MIN_LENGTH - 1 }),
        fc.string(), // Bo'shliqlar uchun prefix
        fc.string(), // Bo'shliqlar uchun suffix
        (shortText, prefix, suffix) => {
          // Oldi va oxiriga bo'shliqlar qo'shamiz
          const textWithWhitespace = prefix + shortText + suffix
          const result = validateComplaintText(textWithWhitespace)
          
          if (result.success) {
            // Bu holat faqat textWithWhitespace.trim().length >= 20 bo'lsa yuz berishi kerak
            expect(textWithWhitespace.trim().length).toBeGreaterThanOrEqual(COMPLAINT_TEXT_MIN_LENGTH)
          } else {
            expect(result.success).toBe(false)
            expect(result.error).toBe('min_length')
            expect(result.minLength).toBe(COMPLAINT_TEXT_MIN_LENGTH)
            expect(textWithWhitespace.trim().length).toBeLessThan(COMPLAINT_TEXT_MIN_LENGTH)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle various whitespace characters correctly', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: COMPLAINT_TEXT_MIN_LENGTH }),
        (coreText) => {
          // Turli xil bo'shliq belgilari bilan test qilish
          const whitespaceVariants = [
            ' ',       // oddiy probel
            '\t',      // tab
            '\n',      // yangi qator
            '\r',      // carriage return
            '\r\n',    // Windows yangi qator
            ' \t\n\r', // aralash
          ]

          for (const ws of whitespaceVariants) {
            const testText = ws + coreText + ws
            const result = validateComplaintText(testText)
            expect(result.success).toBe(true)
          }
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should be consistent with edge case at exactly 20 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: COMPLAINT_TEXT_MIN_LENGTH, maxLength: COMPLAINT_TEXT_MIN_LENGTH }),
        fc.nat({ max: 10 }), // Bo'shliq uzunligi
        (exactText, whitespaceLength) => {
          expect(exactText.length).toBe(COMPLAINT_TEXT_MIN_LENGTH)
          
          // Bo'shliqsiz
          const resultWithoutWhitespace = validateComplaintText(exactText)
          expect(resultWithoutWhitespace.success).toBe(true)
          
          // Bo'shliqlar bilan
          const whitespace = ' '.repeat(whitespaceLength)
          const textWithWhitespace = whitespace + exactText + whitespace
          const resultWithWhitespace = validateComplaintText(textWithWhitespace)
          expect(resultWithWhitespace.success).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle empty and whitespace-only strings', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 50 }), // Bo'shliq uzunligi
        (whitespaceLength) => {
          const whitespaceOnlyText = ' '.repeat(whitespaceLength)
          const result = validateComplaintText(whitespaceOnlyText)
          
          expect(result.success).toBe(false)
          expect(result.error).toBe('min_length')
          expect(result.minLength).toBe(COMPLAINT_TEXT_MIN_LENGTH)
        }
      ),
      { numRuns: 50 }
    )

    // Bo'sh string
    const emptyResult = validateComplaintText('')
    expect(emptyResult.success).toBe(false)
    expect(emptyResult.error).toBe('min_length')
  })

  it('should preserve original behavior for boundary conditions', () => {
    // Aniq 19 belgi (muvaffaqiyatsiz bo'lishi kerak)
    const text19 = 'A'.repeat(19)
    const result19 = validateComplaintText(text19)
    expect(result19.success).toBe(false)
    expect(result19.error).toBe('min_length')

    // Aniq 20 belgi (muvaffaqiyatli bo'lishi kerak)
    const text20 = 'A'.repeat(20)
    const result20 = validateComplaintText(text20)
    expect(result20.success).toBe(true)

    // 21 belgi (muvaffaqiyatli bo'lishi kerak)
    const text21 = 'A'.repeat(21)
    const result21 = validateComplaintText(text21)
    expect(result21.success).toBe(true)
  })
})