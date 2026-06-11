/**
 * Property-based tests for exponential backoff sequences (PBT Task 3.2).
 *
 * **Property 23: Eksponensial backoff ketma-ketligi**
 * **Validates: Requirements 16.5, 21.4**
 *
 * Tests the pure exponential backoff delay calculation functions to ensure
 * they produce deterministic, nondecreasing sequences that never return
 * values outside their predefined tables.
 */
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { computeReconnectDelay, compute5xxRetryDelay } from './backoff'

describe('Backoff ketma-ketligi property testlari', () => {
  describe('computeReconnectDelay', () => {
    it('Property 23a: Reconnect delay jadvalining deterministic nondecreasing xususiyati', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -10, max: 20 }), // Manfiy, nol va jadvaldan tashqari qiymatlarni ham tekshirish
          fc.integer({ min: -10, max: 20 }),
          (n1, n2) => {
            const delay1 = computeReconnectDelay(n1)
            const delay2 = computeReconnectDelay(n2)
            
            // Barcha qiymatlar predefined jadvalda bo'lishi kerak
            const EXPECTED_VALUES = [1000, 2000, 4000, 8000, 16000]
            expect(EXPECTED_VALUES).toContain(delay1)
            expect(EXPECTED_VALUES).toContain(delay2)
            
            // n1 <= n2 bo'lsa, delay1 <= delay2 bo'lishi kerak (nondecreasing)
            if (n1 <= n2) {
              expect(delay1).toBeLessThanOrEqual(delay2)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('Property 23b: Reconnect delay jadval chegaralarining aniq xususiyati', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -100, max: 100 }),
          (n) => {
            const delay = computeReconnectDelay(n)
            
            // n <= 0 uchun birinchi qiymat (1000)
            if (n <= 0) {
              expect(delay).toBe(1000)
            }
            // n >= 4 uchun oxirgi qiymat (16000) - capped
            else if (n >= 4) {
              expect(delay).toBe(16000)
            }
            // Oraliq qiymatlar jadvalga mos
            else {
              const expectedDelays = [1000, 2000, 4000, 8000]
              expect(delay).toBe(expectedDelays[n]!)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('Property 23c: Non-finite va fractional qiymatlar uchun robust xulq-atvor', () => {
      // Non-finite qiymatlar - logic handles !Number.isFinite(n) || n <= 0 as first entry
      expect(computeReconnectDelay(NaN)).toBe(1000)
      expect(computeReconnectDelay(Infinity)).toBe(1000) // Not finite, so first entry
      expect(computeReconnectDelay(-Infinity)).toBe(1000)
      
      // Fractional qiymatlar floor qilinadi
      expect(computeReconnectDelay(1.7)).toBe(2000) // floor(1.7) = 1, jadval[1] = 2000
      expect(computeReconnectDelay(2.9)).toBe(4000) // floor(2.9) = 2, jadval[2] = 4000
    })
  })

  describe('compute5xxRetryDelay', () => {
    it('Property 23d: 5xx retry delay jadvalining deterministic nondecreasing xususiyati', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -5, max: 10 }),
          fc.integer({ min: -5, max: 10 }),
          (n1, n2) => {
            const delay1 = compute5xxRetryDelay(n1)
            const delay2 = compute5xxRetryDelay(n2)
            
            // Barcha qiymatlar predefined jadvalda bo'lishi kerak
            const EXPECTED_VALUES = [300, 900, 2700]
            expect(EXPECTED_VALUES).toContain(delay1)
            expect(EXPECTED_VALUES).toContain(delay2)
            
            // n1 <= n2 bo'lsa, delay1 <= delay2 bo'lishi kerak (nondecreasing)
            if (n1 <= n2) {
              expect(delay1).toBeLessThanOrEqual(delay2)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('Property 23e: 5xx retry delay jadval chegaralarining aniq xususiyati', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -100, max: 100 }),
          (n) => {
            const delay = compute5xxRetryDelay(n)
            
            // n <= 0 uchun birinchi qiymat (300)
            if (n <= 0) {
              expect(delay).toBe(300)
            }
            // n >= 2 uchun oxirgi qiymat (2700) - capped
            else if (n >= 2) {
              expect(delay).toBe(2700)
            }
            // Oraliq qiymatlar jadvalga mos
            else {
              const expectedDelays = [300, 900]
              expect(delay).toBe(expectedDelays[n]!)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('Property 23f: Non-finite va fractional qiymatlar uchun robust xulq-atvor', () => {
      // Non-finite qiymatlar - logic handles !Number.isFinite(n) || n <= 0 as first entry
      expect(compute5xxRetryDelay(NaN)).toBe(300)
      expect(compute5xxRetryDelay(Infinity)).toBe(300) // Not finite, so first entry
      expect(compute5xxRetryDelay(-Infinity)).toBe(300)
      
      // Fractional qiymatlar floor qilinadi
      expect(compute5xxRetryDelay(0.8)).toBe(300)  // floor(0.8) = 0, jadval[0] = 300
      expect(compute5xxRetryDelay(1.9)).toBe(900)  // floor(1.9) = 1, jadval[1] = 900
    })
  })

  describe('Exponential backoff sequence properties', () => {
    it('Property 23g: Sequence elements growth pattern verification (reconnect)', () => {
      // Verify the actual pattern matches the predefined table
      expect(computeReconnectDelay(0)).toBe(1000) // n <= 0 -> first entry
      expect(computeReconnectDelay(1)).toBe(2000)
      expect(computeReconnectDelay(2)).toBe(4000) 
      expect(computeReconnectDelay(3)).toBe(8000)
      expect(computeReconnectDelay(4)).toBe(16000) // capped
      expect(computeReconnectDelay(5)).toBe(16000) // still capped
      expect(computeReconnectDelay(100)).toBe(16000) // still capped
      
      // Verify nondecreasing property
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10 }),
          (n) => {
            const current = computeReconnectDelay(n)
            const next = computeReconnectDelay(n + 1)
            expect(next).toBeGreaterThanOrEqual(current)
          }
        ),
        { numRuns: 20 }
      )
    })

    it('Property 23h: Sequence elements growth pattern verification (5xx)', () => {
      // Verify the actual pattern matches the predefined table  
      expect(compute5xxRetryDelay(0)).toBe(300) // n <= 0 -> first entry
      expect(compute5xxRetryDelay(1)).toBe(900)
      expect(compute5xxRetryDelay(2)).toBe(2700) // capped
      expect(compute5xxRetryDelay(3)).toBe(2700) // still capped
      expect(compute5xxRetryDelay(100)).toBe(2700) // still capped
      
      // Verify nondecreasing property
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 5 }),
          (n) => {
            const current = compute5xxRetryDelay(n)
            const next = compute5xxRetryDelay(n + 1)
            expect(next).toBeGreaterThanOrEqual(current)
          }
        ),
        { numRuns: 20 }
      )
    })
  })
})