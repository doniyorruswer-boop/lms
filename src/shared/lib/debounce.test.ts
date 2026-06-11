/**
 * Property-based tests for debounce utility with fake timers (PBT Task 3.6).
 *
 * **Property 14: Debounce invariant (umumiy)**
 * **Validates: Requirements 7.4, 17.3**
 *
 * Tests the debounce function to ensure it only fires after a quiet period
 * following the last event, which is critical for test answer autosave
 * and report filters.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fc from 'fast-check'
import { debounce } from './debounce'
import { arbTimestampStream } from '@/test/generators'

describe('Debounce property testlari', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Property 14: Debounce invariant', () => {
    it('Property 14a: Funksiya faqat oxirgi hodisadan keyingi tinch davrda chaqiriladi', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 5000 }), // delayMs
          arbTimestampStream.filter(timestamps => timestamps.length >= 2),
          (delayMs, timestamps) => {
            const calls: { time: number; args: number }[] = []
            const fn = vi.fn((arg: number) => {
              calls.push({ time: Date.now(), args: arg })
            })
            const debouncedFn = debounce(fn, delayMs)

            // Simulate calls at given timestamps
            for (let i = 0; i < timestamps.length; i++) {
              vi.setSystemTime(timestamps[i]!)
              debouncedFn(i)
            }

            // Fast-forward past the debounce delay
            const lastTimestamp = timestamps[timestamps.length - 1]!
            vi.setSystemTime(lastTimestamp + delayMs + 100)
            vi.runAllTimers() // Run all pending timers

            // Property: should have exactly one call (after the last event)
            expect(calls).toHaveLength(1)
            
            // The call should happen after the last event + delayMs
            const callTime = calls[0]!.time
            expect(callTime).toBeGreaterThanOrEqual(lastTimestamp + delayMs)
            
            // Should be called with the last argument
            expect(calls[0]!.args).toBe(timestamps.length - 1)
          }
        ),
        { numRuns: 50 }
      )
    })

    it('Property 14b: Har bir chaqiruv vaqtidan oldingi delayMs ichida hech qanday hodisa kelmagan', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 500, max: 2000 }),
          fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 3, maxLength: 10 }),
          (delayMs, intervals) => {
            const calls: number[] = []
            const fn = vi.fn(() => calls.push(Date.now()))
            const debouncedFn = debounce(fn, delayMs)

            let currentTime = 1000
            
            // Create a series of calls with specific intervals
            for (let i = 0; i < intervals.length; i++) {
              vi.setSystemTime(currentTime)
              debouncedFn(i)
              
              // If this is not the last call, add interval that's less than delayMs
              if (i < intervals.length - 1) {
                currentTime += Math.min(intervals[i]!, delayMs - 10)
              }
            }

            // Fast-forward to trigger the debounced call
            vi.setSystemTime(currentTime + delayMs + 100)
            vi.runAllTimers()

            // Should have exactly one call at the end
            expect(calls).toHaveLength(1)
            
            // Verify the quiet period property: no events in the delayMs before the call
            const callTime = calls[0]!
            const quietPeriodStart = callTime - delayMs
            expect(quietPeriodStart).toBeLessThanOrEqual(currentTime)
          }
        ),
        { numRuns: 30 }
      )
    })

    it('Property 14c: Cancel funksiyasi pending chaqiruvlarni to\'liq bekor qiladi', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 3000 }),
          (delayMs) => {
            const fn = vi.fn()
            const debouncedFn = debounce(fn, delayMs)

            vi.setSystemTime(1000)
            debouncedFn('test-arg')
            
            // Verify pending state
            expect(debouncedFn.pending()).toBe(true)

            // Cancel before the delay elapses
            vi.setSystemTime(1000 + delayMs * 0.5)
            debouncedFn.cancel()
            
            expect(debouncedFn.pending()).toBe(false)

            // Fast-forward past original delay
            vi.runAllTimers()
            
            // Function should not have been called
            expect(fn).not.toHaveBeenCalled()
          }
        ),
        { numRuns: 30 }
      )
    })

    it('Property 14d: Flush funksiyasi pending chaqiruvni darhol bajaradi', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 3000 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          (delayMs, testArg) => {
            const fn = vi.fn()
            const debouncedFn = debounce(fn, delayMs)

            vi.setSystemTime(1000)
            debouncedFn(testArg)
            
            expect(debouncedFn.pending()).toBe(true)

            // Flush before delay naturally elapses
            const flushTime = 1000 + delayMs * 0.3
            vi.setSystemTime(flushTime)
            debouncedFn.flush()

            // Function should have been called immediately with correct args
            expect(fn).toHaveBeenCalledTimes(1)
            expect(fn).toHaveBeenCalledWith(testArg)
            expect(debouncedFn.pending()).toBe(false)

            // No additional calls should happen after natural delay
            vi.runAllTimers()
            expect(fn).toHaveBeenCalledTimes(1)
          }
        ),
        { numRuns: 30 }
      )
    })
  })

  describe('Test answer autosave va report filter use cases', () => {
    it('Property 14e: Test javob autosave 5 soniyalik debounce xususiyati', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 3, maxLength: 15 }),
          (answerSequence) => {
            const AUTOSAVE_DELAY = 5000 // 5 seconds as per Req 7.4
            const saveOperations: { time: number; answer: string }[] = []
            
            const saveAnswer = vi.fn((answer: string) => {
              saveOperations.push({ time: Date.now(), answer })
            })
            const debouncedSave = debounce(saveAnswer, AUTOSAVE_DELAY)

            let currentTime = 10000 // Start at 10s
            
            // Simulate rapid typing (answer changes)
            for (const answer of answerSequence) {
              vi.setSystemTime(currentTime)
              debouncedSave(answer)
              currentTime += 200 // Typing every 200ms (much faster than debounce)
            }

            // Wait for the debounce period to complete
            vi.setSystemTime(currentTime + AUTOSAVE_DELAY + 100)
            vi.runAllTimers()

            // Should have exactly one save operation (with the final answer)
            expect(saveOperations).toHaveLength(1)
            expect(saveOperations[0]!.answer).toBe(answerSequence[answerSequence.length - 1])
            
            // The save should happen after typing stopped
            const saveTime = saveOperations[0]!.time
            const lastTypingTime = currentTime - 200
            expect(saveTime).toBeGreaterThanOrEqual(lastTypingTime + AUTOSAVE_DELAY)
          }
        ),
        { numRuns: 25 }
      )
    })

    it('Property 14f: Report filter 1 soniyalik debounce xususiyati', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 0, maxLength: 20 }), { minLength: 5, maxLength: 20 }),
          (filterSequence) => {
            const FILTER_DELAY = 1000 // 1 second as per Req 17.3
            const filterOperations: { time: number; filter: string }[] = []
            
            const applyFilter = vi.fn((filter: string) => {
              filterOperations.push({ time: Date.now(), filter })
            })
            const debouncedFilter = debounce(applyFilter, FILTER_DELAY)

            let currentTime = 5000
            
            // Simulate rapid filter changes
            for (const filter of filterSequence) {
              vi.setSystemTime(currentTime)
              debouncedFilter(filter)
              currentTime += 50 // Very rapid changes (20 changes/second)
            }

            // Complete the debounce period
            vi.setSystemTime(currentTime + FILTER_DELAY + 50)
            vi.runAllTimers()

            // Should have exactly one filter application (with final filter)
            expect(filterOperations).toHaveLength(1)
            expect(filterOperations[0]!.filter).toBe(filterSequence[filterSequence.length - 1])
            
            // Verify timing
            const filterTime = filterOperations[0]!.time
            const lastChangeTime = currentTime - 50
            expect(filterTime).toBeGreaterThanOrEqual(lastChangeTime + FILTER_DELAY)
          }
        ),
        { numRuns: 25 }
      )
    })
  })

  describe('Edge cases va robust behavior', () => {
    it('Property 14g: Zero va manfiy delay qiymatlariga nisbatan robust', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -100, max: 0 }),
          (invalidDelay) => {
            const fn = vi.fn()
            
            expect(() => {
              const debouncedFn = debounce(fn, invalidDelay)
              debouncedFn('test')
              
              // Should execute immediately for zero/negative delays
              vi.runAllTimers()
              expect(fn).toHaveBeenCalled()
            }).not.toThrow()
          }
        ),
        { numRuns: 10 }
      )
    })

    it('Property 14h: Consecutive calls with same arguments properly coalesced', () => {
      const delayMs = 1000
      const fn = vi.fn()
      const debouncedFn = debounce(fn, delayMs)

      const sameArg = 'repeated-arg'
      
      vi.setSystemTime(1000)
      debouncedFn(sameArg)
      
      vi.setSystemTime(1200)
      debouncedFn(sameArg)
      
      vi.setSystemTime(1400)
      debouncedFn(sameArg)

      // Complete debounce
      vi.setSystemTime(1400 + delayMs + 100)
      vi.runAllTimers()

      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith(sameArg)
    })

    it('Property 14i: Pending state accurately reflects internal timer state', () => {
      const delayMs = 2000
      const fn = vi.fn()
      const debouncedFn = debounce(fn, delayMs)

      // Initially not pending
      expect(debouncedFn.pending()).toBe(false)

      // After call, should be pending
      vi.setSystemTime(1000)
      debouncedFn('test')
      expect(debouncedFn.pending()).toBe(true)

      // Still pending before delay completes
      vi.setSystemTime(1000 + delayMs - 100)
      expect(debouncedFn.pending()).toBe(true)

      // Not pending after delay completes
      vi.setSystemTime(1000 + delayMs + 100)
      vi.runAllTimers()
      expect(debouncedFn.pending()).toBe(false)
      expect(fn).toHaveBeenCalled()
    })
  })
})