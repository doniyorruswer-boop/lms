/**
 * Property-based tests for SCORM lifecycle invariant.
 * 
 * **Validates: Requirements 6.4**
 * Property 12: SCORM lifecycle invariant — terminate keyin operatsiyalar bekor
 */

import { describe, it, expect, vi } from "vitest";
import fc from "fast-check";
import { ScormBridge, type ScormVersion } from "./bridge";

/**
 * Arbitrary generator for SCORM operation sequences.
 */
const arbOperation = fc.oneof(
  fc.record({
    type: fc.constant("getValue" as const),
    key: fc.string({ minLength: 1, maxLength: 20 })
  }),
  fc.record({
    type: fc.constant("setValue" as const),
    key: fc.string({ minLength: 1, maxLength: 20 }),
    value: fc.string({ maxLength: 100 })
  }),
  fc.record({
    type: fc.constant("commit" as const)
  })
);

/**
 * Arbitrary generator for sequences of operations.
 */
const arbOperationSequence = fc.array(arbOperation, { minLength: 0, maxLength: 20 });

/**
 * Arbitrary generator for SCORM versions.
 */
const arbScormVersion = fc.oneof(fc.constant("1.2"), fc.constant("2004")) as fc.Arbitrary<ScormVersion>;

describe("SCORM Lifecycle Property Tests", () => {
  describe("Property 12: Lifecycle invariant - terminate blocks operations", () => {
    it("should reject all operations consistently after termination", () => {
      fc.assert(
        fc.property(
          arbScormVersion,
          arbOperationSequence,
          arbOperationSequence,
          (version, preOps, postOps) => {
            const mockCommit = vi.fn();
            const bridge = new ScormBridge({ version, onCommit: mockCommit });
            
            // Initialize and perform pre-termination operations
            expect(bridge.initialize()).toBe("true");
            
            // Execute pre-termination operations (these should work)
            for (const op of preOps) {
              switch (op.type) {
                case "getValue":
                  bridge.getValue(op.key); // May return empty string, but should not error
                  break;
                case "setValue":
                  expect(bridge.setValue(op.key, op.value)).toBe("true");
                  break;
                case "commit":
                  expect(bridge.commit()).toBe("true");
                  break;
              }
            }
            
            // Count commits before termination
            const commitsBeforeTerminate = mockCommit.mock.calls.length;
            
            // Terminate the session
            expect(bridge.terminate()).toBe("true");
            
            // Termination should trigger final commit
            expect(mockCommit.mock.calls.length).toBe(commitsBeforeTerminate + 1);
            
            // Clear mock for post-termination tracking
            mockCommit.mockClear();
            
            // All post-termination operations should fail
            for (const op of postOps) {
              switch (op.type) {
                case "getValue":
                  const result = bridge.getValue(op.key);
                  // Should return empty string and set error
                  expect(result).toBe("");
                  expect(bridge.getLastError()).not.toBe("0");
                  break;
                case "setValue":
                  expect(bridge.setValue(op.key, op.value)).toBe("false");
                  expect(bridge.getLastError()).not.toBe("0");
                  break;
                case "commit":
                  expect(bridge.commit()).toBe("false");
                  expect(bridge.getLastError()).not.toBe("0");
                  break;
              }
            }
            
            // No commits should have happened after termination
            expect(mockCommit).not.toHaveBeenCalled();
            
            // Bridge state should remain terminated
            expect(bridge.isTerminated).toBe(true);
            expect(bridge.isRunning).toBe(false);
            expect(bridge.lifecycleState).toBe("terminated");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should maintain operation rejection across method name variants", () => {
      fc.assert(
        fc.property(arbOperation, (operation) => {
          // Test both SCORM 1.2 and 2004 method variants
          const bridge12 = new ScormBridge({ version: "1.2" });
          const bridge2004 = new ScormBridge({ version: "2004" });
          
          // Initialize both
          bridge12.LMSInitialize();
          bridge2004.Initialize();
          
          // Terminate both
          bridge12.LMSFinish();
          bridge2004.Terminate();
          
          // Test rejection using different method names
          switch (operation.type) {
            case "getValue":
              // Both should return empty string and set error
              expect(bridge12.LMSGetValue(operation.key)).toBe("");
              expect(bridge2004.GetValue(operation.key)).toBe("");
              expect(bridge12.LMSGetLastError()).not.toBe("0");
              expect(bridge2004.GetLastError()).not.toBe("0");
              break;
              
            case "setValue":
              expect(bridge12.LMSSetValue(operation.key, operation.value)).toBe("false");
              expect(bridge2004.SetValue(operation.key, operation.value)).toBe("false");
              expect(bridge12.LMSGetLastError()).not.toBe("0");
              expect(bridge2004.GetLastError()).not.toBe("0");
              break;
              
            case "commit":
              expect(bridge12.LMSCommit()).toBe("false");
              expect(bridge2004.Commit()).toBe("false");
              expect(bridge12.LMSGetLastError()).not.toBe("0");
              expect(bridge2004.GetLastError()).not.toBe("0");
              break;
          }
        }),
        { numRuns: 100 }
      );
    });

    it("should prevent commit callback invocation after termination for any operation sequence", () => {
      fc.assert(
        fc.property(arbScormVersion, arbOperationSequence, (version, operations) => {
          let commitCount = 0;
          const trackingCommit = vi.fn(() => { commitCount++; });
          
          const bridge = new ScormBridge({ version, onCommit: trackingCommit });
          
          // Normal lifecycle
          bridge.initialize();
          bridge.terminate(); // This should trigger one final commit
          
          const commitsAfterTerminate = commitCount;
          trackingCommit.mockClear();
          
          // Execute operations after termination
          for (const op of operations) {
            switch (op.type) {
              case "setValue":
                bridge.setValue(op.key, op.value);
                break;
              case "commit":
                bridge.commit();
                break;
              // getValue doesn't trigger commits, so skip it
            }
          }
          
          // No additional commits should have occurred
          expect(trackingCommit).not.toHaveBeenCalled();
          expect(commitCount).toBe(commitsAfterTerminate);
        }),
        { numRuns: 100 }
      );
    });

    it("should maintain error state consistency after failed operations", () => {
      fc.assert(
        fc.property(arbScormVersion, fc.array(arbOperation, { minLength: 1 }), (version, operations) => {
          const bridge = new ScormBridge({ version });
          
          // Initialize and terminate immediately
          bridge.initialize();
          bridge.terminate();
          
          let lastError = "0";
          
          // Each failed operation should set a non-zero error
          for (const op of operations) {
            switch (op.type) {
              case "getValue":
                bridge.getValue(op.key);
                break;
              case "setValue":
                bridge.setValue(op.key, op.value);
                break;
              case "commit":
                bridge.commit();
                break;
            }
            
            // Error should be set and consistent
            const currentError = bridge.getLastError();
            expect(currentError).not.toBe("0");
            
            // Error string should be available
            const errorString = bridge.getErrorString();
            expect(errorString).toBeTruthy();
            expect(errorString.length).toBeGreaterThan(0);
            
            // Diagnostic should match error string
            expect(bridge.getDiagnostic()).toBe(errorString);
          }
        }),
        { numRuns: 100 }
      );
    });

    it("should handle rapid operation attempts after termination", () => {
      fc.assert(
        fc.property(
          arbScormVersion,
          fc.integer({ min: 1, max: 100 }),
          fc.string({ minLength: 1, maxLength: 10 }),
          (version, iterations, testKey) => {
            const mockCommit = vi.fn();
            const bridge = new ScormBridge({ version, onCommit: mockCommit });
            
            // Setup and terminate
            bridge.initialize();
            bridge.terminate();
            mockCommit.mockClear();
            
            // Rapid-fire operations
            for (let i = 0; i < iterations; i++) {
              expect(bridge.setValue(`${testKey}_${i}`, `value_${i}`)).toBe("false");
              expect(bridge.getValue(`${testKey}_${i}`)).toBe("");
              expect(bridge.commit()).toBe("false");
              
              // State should remain consistent
              expect(bridge.isTerminated).toBe(true);
              expect(bridge.isRunning).toBe(false);
            }
            
            // No commits should have occurred
            expect(mockCommit).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});