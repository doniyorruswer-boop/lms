/**
 * Property-based tests for SCORM lifecycle invariant (Task 8.3).
 * 
 * **Validates: Requirements 6.4**
 * **Property 12: SCORM lifecycle invariant — terminate keyin operatsiyalar bekor**
 * 
 * Tests that after LMSFinish/Terminate is called:
 * - All subsequent LMSSetValue/SetValue calls return "false" and set error codes
 * - All subsequent LMSGetValue/GetValue calls return empty string and set error codes
 * - All subsequent LMSCommit/Commit calls return "false" and set error codes
 * - No backend commit is sent after termination (onCommit not called)
 * Uses fast-check with { numRuns: 25 } for faster execution as requested.
 */

import { describe, it, expect, vi } from 'vitest'
import fc from 'fast-check'
import { ScormBridge } from './lifecycle'

describe('SCORM lifecycle invariant tests', () => {
  it('Property 12: SCORM lifecycle invariant — terminate keyin operatsiyalar bekor (SCORM 1.2)', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            key: fc.string({ minLength: 1, maxLength: 30 }),
            value: fc.string({ minLength: 0, maxLength: 100 })
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (operations) => {
          const mockCommit = vi.fn()
          const bridge = new ScormBridge({ 
            version: '1.2',
            onCommit: mockCommit 
          })
          
          // Normal session lifecycle
          expect(bridge.LMSInitialize()).toBe('true')
          expect(bridge.isRunning).toBe(true)
          
          // Set some data before termination
          const preTerminationData = operations.slice(0, 2)
          for (const { key, value } of preTerminationData) {
            expect(bridge.LMSSetValue(key, value)).toBe('true')
          }
          
          // Terminate the session
          expect(bridge.LMSFinish()).toBe('true')
          expect(bridge.isTerminated).toBe(true)
          expect(mockCommit).toHaveBeenCalled()
          mockCommit.mockClear()
          
          // After termination, all operations should fail
          const postTerminationOps = operations.slice(2)
          for (const { key, value } of postTerminationOps) {
            // setValue should fail
            expect(bridge.LMSSetValue(key, value)).toBe('false')
            expect(bridge.LMSGetLastError()).not.toBe('0') // Should have error
            
            // getValue should return empty and error
            expect(bridge.LMSGetValue(key)).toBe('')
            expect(bridge.LMSGetLastError()).not.toBe('0') // Should have error
            
            // commit should fail
            expect(bridge.LMSCommit()).toBe('false')
            expect(bridge.LMSGetLastError()).not.toBe('0') // Should have error
          }
          
          // No commits should happen after termination
          expect(mockCommit).not.toHaveBeenCalled()
        }
      ),
      { numRuns: 25 }
    )
  })

  it('Property 12: SCORM lifecycle invariant — terminate keyin operatsiyalar bekor (SCORM 2004)', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            key: fc.string({ minLength: 1, maxLength: 30 }),
            value: fc.string({ minLength: 0, maxLength: 100 })
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (operations) => {
          const mockCommit = vi.fn()
          const bridge = new ScormBridge({ 
            version: '2004',
            onCommit: mockCommit 
          })
          
          // Normal session lifecycle
          expect(bridge.Initialize()).toBe('true')
          expect(bridge.isRunning).toBe(true)
          
          // Set some data before termination
          const preTerminationData = operations.slice(0, 2)
          for (const { key, value } of preTerminationData) {
            expect(bridge.SetValue(key, value)).toBe('true')
          }
          
          // Terminate the session
          expect(bridge.Terminate()).toBe('true')
          expect(bridge.isTerminated).toBe(true)
          expect(mockCommit).toHaveBeenCalled()
          mockCommit.mockClear()
          
          // After termination, all operations should fail
          const postTerminationOps = operations.slice(2)
          for (const { key, value } of postTerminationOps) {
            // setValue should fail
            expect(bridge.SetValue(key, value)).toBe('false')
            expect(bridge.GetLastError()).not.toBe('0') // Should have error
            
            // getValue should return empty and error
            expect(bridge.GetValue(key)).toBe('')
            expect(bridge.GetLastError()).not.toBe('0') // Should have error
            
            // commit should fail
            expect(bridge.Commit()).toBe('false')
            expect(bridge.GetLastError()).not.toBe('0') // Should have error
          }
          
          // No commits should happen after termination
          expect(mockCommit).not.toHaveBeenCalled()
        }
      ),
      { numRuns: 25 }
    )
  })

  it('Property 12: Multiple terminate attempts fail', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 5 }), // number of terminate attempts
        (attempts) => {
          const bridge = new ScormBridge({ version: '1.2' })
          
          expect(bridge.LMSInitialize()).toBe('true')
          
          // First terminate should succeed
          expect(bridge.LMSFinish()).toBe('true')
          expect(bridge.isTerminated).toBe(true)
          
          // Subsequent terminates should fail
          for (let i = 0; i < attempts - 1; i++) {
            expect(bridge.LMSFinish()).toBe('false')
            expect(bridge.LMSGetLastError()).not.toBe('0')
          }
        }
      ),
      { numRuns: 25 }
    )
  })

  it('Property 12: Operations before initialization also fail', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }), // key
        fc.string({ minLength: 0, maxLength: 100 }), // value
        (key, value) => {
          const mockCommit = vi.fn()
          const bridge = new ScormBridge({ 
            version: '1.2',
            onCommit: mockCommit 
          })
          
          // Before initialization, operations should fail
          expect(bridge.LMSSetValue(key, value)).toBe('false')
          expect(bridge.LMSGetValue(key)).toBe('')
          expect(bridge.LMSCommit()).toBe('false')
          expect(bridge.LMSFinish()).toBe('false')
          
          // No commits should happen
          expect(mockCommit).not.toHaveBeenCalled()
          
          // All operations should set error codes
          expect(bridge.LMSGetLastError()).not.toBe('0')
        }
      ),
      { numRuns: 25 }
    )
  })

  it('Property 12: Termination triggers final commit once', () => {
    const mockCommit = vi.fn()
    const bridge = new ScormBridge({ 
      version: '1.2',
      onCommit: mockCommit 
    })
    
    bridge.LMSInitialize()
    bridge.LMSSetValue('test', 'value')
    
    // Manual commit
    bridge.LMSCommit()
    expect(mockCommit).toHaveBeenCalledTimes(1)
    
    // Termination should trigger one final commit
    bridge.LMSFinish()
    expect(mockCommit).toHaveBeenCalledTimes(2)
    
    // Further operations should not trigger commits
    bridge.LMSSetValue('other', 'data')
    bridge.LMSCommit()
    expect(mockCommit).toHaveBeenCalledTimes(2) // No additional commits
  })

  it('Property 12: Session state transitions are irreversible', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 3 }),
        (keys) => {
          const bridge = new ScormBridge({ version: '1.2' })
          
          // Start in not_initialized
          expect(bridge.lifecycleState).toBe('not_initialized')
          
          // Move to running
          bridge.LMSInitialize()
          expect(bridge.lifecycleState).toBe('running')
          expect(bridge.isRunning).toBe(true)
          expect(bridge.isTerminated).toBe(false)
          
          // Move to terminated
          bridge.LMSFinish()
          expect(bridge.lifecycleState).toBe('terminated')
          expect(bridge.isRunning).toBe(false)
          expect(bridge.isTerminated).toBe(true)
          
          // Cannot go back to any other state
          expect(bridge.LMSInitialize()).toBe('false')
          expect(bridge.lifecycleState).toBe('terminated')
        }
      ),
      { numRuns: 25 }
    )
  })
})