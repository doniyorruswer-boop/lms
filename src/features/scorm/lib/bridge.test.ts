/**
 * Property-based tests for SCORM bridge data model and lifecycle.
 *
 * Tests Properties 10 and 12 from the design document:
 * - Property 10: SCORM data round-trip integrity
 * - Property 12: SCORM lifecycle invariant - terminate blocks operations
 */

import { describe, it, expect, vi } from "vitest";
import fc from "fast-check";
import { ScormBridge, type ScormVersion, type CommitHandler } from "./bridge";

/**
 * Arbitrary generator for SCORM data keys (CMI data model paths).
 */
const arbScormKey = fc.oneof(
  fc.constant("cmi.core.lesson_status"),
  fc.constant("cmi.core.lesson_location"), 
  fc.constant("cmi.core.score.raw"),
  fc.constant("cmi.core.score.max"),
  fc.constant("cmi.core.score.min"),
  fc.constant("cmi.core.session_time"),
  fc.constant("cmi.completion_status"),
  fc.constant("cmi.success_status"),
  fc.constant("cmi.location"),
  fc.constant("cmi.score.scaled"),
  fc.string({ minLength: 1, maxLength: 50 }).map(s => `cmi.${s.replace(/[^a-zA-Z0-9_.]/g, '_')}`)
);

/**
 * Arbitrary generator for SCORM data values.
 */
const arbScormValue = fc.oneof(
  fc.string({ maxLength: 255 }),
  fc.constant("completed"),
  fc.constant("incomplete"), 
  fc.constant("passed"),
  fc.constant("failed"),
  fc.constant("browsed"),
  fc.constant("not attempted"),
  fc.float({ min: 0, max: 100 }).map(String),
  fc.integer({ min: 0, max: 9999 }).map(String)
);

/**
 * Arbitrary generator for SCORM versions.
 */
const arbScormVersion = fc.oneof(fc.constant("1.2"), fc.constant("2004")) as fc.Arbitrary<ScormVersion>;

/**
 * Arbitrary generator for key-value pairs.
 */
const arbKeyValuePair = fc.tuple(arbScormKey, arbScormValue);

/**
 * Arbitrary generator for arrays of key-value operations.
 */
const arbOperations = fc.array(arbKeyValuePair, { minLength: 1, maxLength: 10 });

describe("ScormBridge Property Tests", () => {
  describe("Property 10: SCORM data round-trip integrity", () => {
    it("should preserve data values through setValue/getValue round-trip", () => {
      fc.assert(
        fc.property(arbScormVersion, arbKeyValuePair, (version, [key, value]) => {
          const bridge = new ScormBridge({ version });
          
          // Initialize the bridge
          expect(bridge.initialize()).toBe("true");
          
          // Set the value
          expect(bridge.setValue(key, value)).toBe("true");
          
          // Get the value back - it should be identical
          const retrieved = bridge.getValue(key);
          expect(retrieved).toBe(value);
        }),
        { numRuns: 100 }
      );
    });

    it("should handle multiple key-value operations maintaining all data", () => {
      fc.assert(
        fc.property(arbScormVersion, arbOperations, (version, operations) => {
          const bridge = new ScormBridge({ version });
          
          // Initialize
          expect(bridge.initialize()).toBe("true");
          
          // Store all operations
          const expectedData = new Map<string, string>();
          for (const [key, value] of operations) {
            bridge.setValue(key, value);
            expectedData.set(key, value); // Later values overwrite earlier ones
          }
          
          // Verify all stored values can be retrieved correctly
          for (const [key, expectedValue] of expectedData) {
            const actualValue = bridge.getValue(key);
            expect(actualValue).toBe(expectedValue);
          }
        }),
        { numRuns: 100 }
      );
    });

    it("should return empty string for unset keys", () => {
      fc.assert(
        fc.property(arbScormVersion, arbScormKey, (version, key) => {
          const bridge = new ScormBridge({ version });
          
          // Initialize but don't set any values
          expect(bridge.initialize()).toBe("true");
          
          // Getting an unset key should return empty string
          const value = bridge.getValue(key);
          expect(value).toBe("");
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("Property 12: SCORM lifecycle invariant - terminate blocks operations", () => {
    it("should reject all operations after terminate", () => {
      fc.assert(
        fc.property(arbScormVersion, arbKeyValuePair, (version, [key, value]) => {
          const mockCommit = vi.fn();
          const bridge = new ScormBridge({ version, onCommit: mockCommit });
          
          // Normal lifecycle: initialize -> operations -> terminate
          expect(bridge.initialize()).toBe("true");
          expect(bridge.setValue(key, "initial")).toBe("true");
          expect(bridge.terminate()).toBe("true");
          
          // After terminate, all operations should be rejected
          expect(bridge.getValue(key)).toBe(""); // Should return empty and set error
          expect(bridge.setValue(key, value)).toBe("false");
          expect(bridge.commit()).toBe("false");
          
          // Error codes should indicate post-termination state
          expect(bridge.getLastError()).not.toBe("0");
          
          // Verify the bridge reports terminated state
          expect(bridge.isTerminated).toBe(true);
          expect(bridge.isRunning).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("should not invoke onCommit after termination", () => {
      fc.assert(
        fc.property(arbScormVersion, arbOperations, (version, operations) => {
          const mockCommit = vi.fn();
          const bridge = new ScormBridge({ version, onCommit: mockCommit });
          
          // Initialize and perform operations
          expect(bridge.initialize()).toBe("true");
          for (const [key, value] of operations) {
            bridge.setValue(key, value);
          }
          
          // Terminate (this should trigger final commit)
          mockCommit.mockClear();
          expect(bridge.terminate()).toBe("true");
          expect(mockCommit).toHaveBeenCalledTimes(1);
          
          // Clear the mock and try operations after termination
          mockCommit.mockClear();
          
          // These should all fail and NOT trigger commits
          bridge.setValue("test.key", "test.value");
          bridge.commit();
          
          // onCommit should never be called after termination
          expect(mockCommit).not.toHaveBeenCalled();
        }),
        { numRuns: 50 }
      );
    });

    it("should reject operations before initialization", () => {
      fc.assert(
        fc.property(arbScormVersion, arbKeyValuePair, (version, [key, value]) => {
          const mockCommit = vi.fn();
          const bridge = new ScormBridge({ version, onCommit: mockCommit });
          
          // Don't initialize - all operations should be rejected
          expect(bridge.getValue(key)).toBe("");
          expect(bridge.setValue(key, value)).toBe("false");
          expect(bridge.commit()).toBe("false");
          expect(bridge.terminate()).toBe("false");
          
          // onCommit should never be called
          expect(mockCommit).not.toHaveBeenCalled();
          
          // Should report not initialized state
          expect(bridge.isRunning).toBe(false);
          expect(bridge.isTerminated).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("should handle double initialization correctly", () => {
      fc.assert(
        fc.property(arbScormVersion, (version) => {
          const bridge = new ScormBridge({ version });
          
          // First initialization should succeed
          expect(bridge.initialize()).toBe("true");
          expect(bridge.isRunning).toBe(true);
          
          // Second initialization should fail
          expect(bridge.initialize()).toBe("false");
          expect(bridge.getLastError()).not.toBe("0");
          
          // But bridge should still be in running state
          expect(bridge.isRunning).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it("should handle double termination correctly", () => {
      fc.assert(
        fc.property(arbScormVersion, (version) => {
          const mockCommit = vi.fn();
          const bridge = new ScormBridge({ version, onCommit: mockCommit });
          
          // Normal flow
          expect(bridge.initialize()).toBe("true");
          expect(bridge.terminate()).toBe("true");
          expect(mockCommit).toHaveBeenCalledTimes(1);
          
          // Second termination should fail and not trigger commit
          mockCommit.mockClear();
          expect(bridge.terminate()).toBe("false");
          expect(mockCommit).not.toHaveBeenCalled();
          expect(bridge.getLastError()).not.toBe("0");
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("Standard compatibility", () => {
    it("should provide identical behavior for SCORM 1.2 and 2004 method names", () => {
      fc.assert(
        fc.property(arbKeyValuePair, ([key, value]) => {
          const bridge12 = new ScormBridge({ version: "1.2" });
          const bridge2004 = new ScormBridge({ version: "2004" });
          
          // Test SCORM 1.2 methods
          expect(bridge12.LMSInitialize()).toBe("true");
          expect(bridge12.LMSSetValue(key, value)).toBe("true");
          expect(bridge12.LMSGetValue(key)).toBe(value);
          expect(bridge12.LMSFinish()).toBe("true");
          
          // Test SCORM 2004 methods - should behave identically
          expect(bridge2004.Initialize()).toBe("true");
          expect(bridge2004.SetValue(key, value)).toBe("true");
          expect(bridge2004.GetValue(key)).toBe(value);
          expect(bridge2004.Terminate()).toBe("true");
        }),
        { numRuns: 100 }
      );
    });
  });
});