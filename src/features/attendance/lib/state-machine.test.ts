/**
 * Property-based test for attendance state machine logic.
 *
 * **Validates: Requirements 9.1, 9.2, 9.3**
 * Property 17: Davomat holat-mashinasi tranzitsiyalari
 */

import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import { 
  attendanceTransition, 
  type AttendanceState, 
  type AttendanceAction,
  type AttendanceTransitionResult 
} from './state-machine';

// Generators for state machine inputs
const arbState = fc.constantFrom<AttendanceState>('idle', 'in', 'out');
const arbAction = fc.constantFrom<AttendanceAction>('check_in', 'check_out');

describe('attendanceTransition', () => {
  it('Property 17: Davomat holat-mashinasi tranzitsiyalari', () => {
    fc.assert(
      fc.property(
        fc.record({
          state: arbState,
          action: arbAction,
        }),
        ({ state, action }) => {
          const result = attendanceTransition(state, action);

          // Post-condition 1: Result state is always one of {idle, in, out}
          const validStates: AttendanceState[] = ['idle', 'in', 'out'];
          expect(validStates).toContain(result.state);

          // Post-condition 2: Test specific transition rules
          if (state === 'idle' && action === 'check_in') {
            // Valid transition: idle + check_in → in
            expect(result.ok).toBe(true);
            expect(result.state).toBe('in');
          } else if (state === 'in' && action === 'check_out') {
            // Valid transition: in + check_out → out
            expect(result.ok).toBe(true);
            expect(result.state).toBe('out');
          } else {
            // All other combinations should be rejected
            expect(result.ok).toBe(false);
            expect(result.state).toBe(state); // State unchanged on rejection
            expect('error' in result && typeof result.error === 'string').toBe(true);
          }

          // Post-condition 3: Successful transitions always change state
          if (result.ok) {
            if (state === 'idle' && action === 'check_in') {
              expect(result.state).toBe('in');
              expect(result.state).not.toBe(state);
            } else if (state === 'in' && action === 'check_out') {
              expect(result.state).toBe('out');
              expect(result.state).not.toBe(state);
            }
          }

          // Post-condition 4: Failed transitions preserve original state
          if (!result.ok) {
            expect(result.state).toBe(state);
          }
        },
      ),
      { numRuns: 100 }
    );
  });

  it('exhaustively tests all state-action combinations', () => {
    const allStates: AttendanceState[] = ['idle', 'in', 'out'];
    const allActions: AttendanceAction[] = ['check_in', 'check_out'];

    // Test all 6 combinations (3 states × 2 actions)
    for (const state of allStates) {
      for (const action of allActions) {
        const result = attendanceTransition(state, action);

        if ((state === 'idle' && action === 'check_in') || 
            (state === 'in' && action === 'check_out')) {
          // These 2 combinations should succeed
          expect(result.ok).toBe(true);
          expect('error' in result).toBe(false);
        } else {
          // These 4 combinations should fail
          expect(result.ok).toBe(false);
          expect('error' in result).toBe(true);
          expect(result.error).toContain(state);
          expect(result.error).toContain(action);
        }
      }
    }
  });

  it('maintains state machine invariants', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({
          state: arbState,
          action: arbAction,
        }), { minLength: 1, maxLength: 10 }),
        (transitions) => {
          let currentState: AttendanceState = 'idle'; // Always start from idle

          for (const { action } of transitions) {
            const result = attendanceTransition(currentState, action);
            
            // Invariant: Result always contains a valid state
            expect(['idle', 'in', 'out']).toContain(result.state);
            
            // Update current state for next iteration
            currentState = result.state;
            
            // Invariant: If transition failed, state didn't change
            if (!result.ok) {
              // The returned state should be the same as input state
              expect(result.state).toBe(currentState);
            }
          }
        },
      ),
      { numRuns: 100 }
    );
  });

  it('follows attendance workflow rules', () => {
    // Test typical attendance workflow: idle → in → out
    let state: AttendanceState = 'idle';
    
    // Step 1: Check in from idle
    let result = attendanceTransition(state, 'check_in');
    expect(result.ok).toBe(true);
    expect(result.state).toBe('in');
    state = result.state;
    
    // Step 2: Try to check in again (should fail)
    result = attendanceTransition(state, 'check_in');
    expect(result.ok).toBe(false);
    expect(result.state).toBe('in'); // State unchanged
    
    // Step 3: Check out from in
    result = attendanceTransition(state, 'check_out');
    expect(result.ok).toBe(true);
    expect(result.state).toBe('out');
    state = result.state;
    
    // Step 4: Try to check out again (should fail)
    result = attendanceTransition(state, 'check_out');
    expect(result.ok).toBe(false);
    expect(result.state).toBe('out'); // State unchanged
    
    // Step 5: Try to check in from out (should fail)
    result = attendanceTransition(state, 'check_in');
    expect(result.ok).toBe(false);
    expect(result.state).toBe('out'); // State unchanged
  });

  it('ensures error messages are descriptive', () => {
    fc.assert(
      fc.property(
        arbState,
        arbAction,
        (state, action) => {
          const result = attendanceTransition(state, action);
          
          if (!result.ok) {
            // Error message should contain both state and action for debugging
            expect(result.error).toContain(state);
            expect(result.error).toContain(action);
            expect(result.error.length).toBeGreaterThan(10); // Reasonably descriptive
          }
        },
      ),
      { numRuns: 100 }
    );
  });

  it('is deterministic and pure', () => {
    fc.assert(
      fc.property(
        arbState,
        arbAction,
        (state, action) => {
          // Multiple calls with same inputs should produce identical results
          const result1 = attendanceTransition(state, action);
          const result2 = attendanceTransition(state, action);
          
          expect(result1.ok).toBe(result2.ok);
          expect(result1.state).toBe(result2.state);
          
          if (!result1.ok && !result2.ok) {
            expect(result1.error).toBe(result2.error);
          }
        },
      ),
      { numRuns: 100 }
    );
  });
});