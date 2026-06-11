/**
 * Property-based tests for SCORM data model round-trip (Task 8.2).
 * 
 * **Validates: Requirements 6.2**
 * **Property 10: SCORM data modelining round-trip integratsiyasi**
 * 
 * Tests that SCORM bridge maintains data integrity:
 * - After setValue(key, value), getValue(key) returns the same value
 * - Works for both SCORM 1.2 and 2004 standards
 * - Handles various data types (strings, numbers, booleans as strings)
 * - Maintains consistency throughout session lifecycle
 * Uses fast-check with { numRuns: 25 } for faster execution as requested.
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { ScormBridge } from './data-model'

describe('SCORM data model round-trip tests', () => {
  it('Property 10: SCORM data modelining round-trip integratsiyasi (SCORM 1.2)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // key
        fc.string({ minLength: 0, maxLength: 200 }), // value
        (key, value) => {
          const bridge = new ScormBridge({ version: '1.2' })
          
          // Initialize the session
          expect(bridge.LMSInitialize()).toBe('true')
          
          // Set value and verify round-trip
          expect(bridge.LMSSetValue(key, value)).toBe('true')
          expect(bridge.LMSGetValue(key)).toBe(value)
          
          // Verify it persists through multiple gets
          expect(bridge.LMSGetValue(key)).toBe(value)
          expect(bridge.LMSGetValue(key)).toBe(value)
        }
      ),
      { numRuns: 25 }
    )
  })

  it('Property 10: SCORM data modelining round-trip integratsiyasi (SCORM 2004)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // key
        fc.string({ minLength: 0, maxLength: 200 }), // value
        (key, value) => {
          const bridge = new ScormBridge({ version: '2004' })
          
          // Initialize the session
          expect(bridge.Initialize()).toBe('true')
          
          // Set value and verify round-trip
          expect(bridge.SetValue(key, value)).toBe('true')
          expect(bridge.GetValue(key)).toBe(value)
          
          // Verify it persists through multiple gets
          expect(bridge.GetValue(key)).toBe(value)
          expect(bridge.GetValue(key)).toBe(value)
        }
      ),
      { numRuns: 25 }
    )
  })

  it('Property 10: Multiple key-value pairs maintain integrity', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            key: fc.string({ minLength: 1, maxLength: 30 }),
            value: fc.string({ minLength: 0, maxLength: 100 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (pairs) => {
          const bridge = new ScormBridge({ version: '1.2' })
          bridge.LMSInitialize()
          
          // Set all key-value pairs
          for (const { key, value } of pairs) {
            expect(bridge.LMSSetValue(key, value)).toBe('true')
          }
          
          // Verify all pairs can be retrieved correctly
          for (const { key, value } of pairs) {
            expect(bridge.LMSGetValue(key)).toBe(value)
          }
        }
      ),
      { numRuns: 25 }
    )
  })

  it('Property 10: Empty string values are preserved', () => {
    const bridge = new ScormBridge({ version: '1.2' })
    bridge.LMSInitialize()
    
    // Empty string should be preserved exactly
    expect(bridge.LMSSetValue('test_key', '')).toBe('true')
    expect(bridge.LMSGetValue('test_key')).toBe('')
  })

  it('Property 10: Unset keys return empty string', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // key that was never set
        (key) => {
          const bridge = new ScormBridge({ version: '1.2' })
          bridge.LMSInitialize()
          
          // Unset keys should return empty string (SCORM spec)
          expect(bridge.LMSGetValue(key)).toBe('')
        }
      ),
      { numRuns: 25 }
    )
  })

  it('Property 10: Overwriting values works correctly', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }), // key
        fc.string({ minLength: 0, maxLength: 50 }), // initial value
        fc.string({ minLength: 0, max: 50 }), // new value
        (key, initialValue, newValue) => {
          const bridge = new ScormBridge({ version: '1.2' })
          bridge.LMSInitialize()
          
          // Set initial value
          expect(bridge.LMSSetValue(key, initialValue)).toBe('true')
          expect(bridge.LMSGetValue(key)).toBe(initialValue)
          
          // Overwrite with new value
          expect(bridge.LMSSetValue(key, newValue)).toBe('true')
          expect(bridge.LMSGetValue(key)).toBe(newValue)
          
          // Should not return the old value
          if (initialValue !== newValue) {
            expect(bridge.LMSGetValue(key)).not.toBe(initialValue)
          }
        }
      ),
      { numRuns: 25 }
    )
  })

  it('Property 10: Special SCORM standard keys work correctly', () => {
    const standardKeys = [
      'cmi.core.lesson_status',
      'cmi.core.score.raw',
      'cmi.core.student_name',
      'cmi.suspend_data',
      'cmi.completion_status',
      'cmi.score.scaled',
      'cmi.learner_name'
    ]

    fc.assert(
      fc.property(
        fc.constantFrom(...standardKeys),
        fc.oneof(
          fc.constant('completed'),
          fc.constant('incomplete'),
          fc.constant('passed'),
          fc.constant('failed'),
          fc.float({ min: 0, max: 100 }).map(n => n.toString()),
          fc.string({ minLength: 1, maxLength: 100 })
        ),
        (key, value) => {
          const bridge = new ScormBridge({ version: '1.2' })
          bridge.LMSInitialize()
          
          // Standard SCORM keys should work with round-trip
          expect(bridge.LMSSetValue(key, value)).toBe('true')
          expect(bridge.LMSGetValue(key)).toBe(value)
        }
      ),
      { numRuns: 25 }
    )
  })
})