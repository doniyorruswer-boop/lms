/**
 * Property-based tests for SCORM status to xAPI mapping.
 * 
 * **Validates: Requirements 6.3**
 * Property 11: SCORM status → xAPI hodisaga mapping
 */

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { mapScormStatusToXapi, type XapiVerbId } from "./xapi-map";

/**
 * Arbitrary generator for canonical SCORM statuses.
 */
const arbCanonicalScormStatus = fc.oneof(
  fc.constant("completed"),
  fc.constant("incomplete"),
  fc.constant("passed"),
  fc.constant("failed"),
  fc.constant("browsed"),
  fc.constant("not attempted"),
  fc.constant("unknown")
);

/**
 * Arbitrary generator for SCORM 1.2 style statuses (with spaces).
 */
const arbScorm12Status = fc.oneof(
  fc.constant("completed"),
  fc.constant("incomplete"), 
  fc.constant("passed"),
  fc.constant("failed"),
  fc.constant("browsed"),
  fc.constant("not attempted")  // SCORM 1.2 uses spaces
);

/**
 * Arbitrary generator for SCORM 2004 style statuses (with underscores).
 */
const arbScorm2004Status = fc.oneof(
  fc.constant("completed"),
  fc.constant("incomplete"),
  fc.constant("passed"),
  fc.constant("failed"),
  fc.constant("browsed"),
  fc.constant("not_attempted"),  // SCORM 2004 uses underscores
  fc.constant("unknown")         // SCORM 2004 specific
);

/**
 * Arbitrary generator for status strings with variations (case, whitespace).
 */
const arbStatusVariant = fc.oneof(
  // Exact canonical forms
  arbCanonicalScormStatus,
  
  // Case variations
  arbCanonicalScormStatus.map(s => s.toUpperCase()),
  arbCanonicalScormStatus.map(s => s.toLowerCase()),
  
  // Whitespace variations  
  arbCanonicalScormStatus.map(s => ` ${s} `),
  arbCanonicalScormStatus.map(s => `\t${s}\n`),
  
  // Mixed case
  fc.constant("Completed"),
  fc.constant("PASSED"),
  fc.constant("Failed"),
  fc.constant("Not Attempted"),
  fc.constant("NOT_ATTEMPTED"),
  
  // Hyphen variations
  fc.constant("not-attempted"),
  fc.constant("NOT-ATTEMPTED"),
  
  // Invalid/unknown statuses
  fc.string({ minLength: 1, maxLength: 20 })
    .filter(s => !["completed", "incomplete", "passed", "failed", "browsed", "not_attempted", "unknown"].includes(s.trim().toLowerCase().replace(/[\s-]+/g, "_")))
);

/**
 * All valid xAPI verb IDs that the mapping can produce.
 */
const VALID_XAPI_VERBS: XapiVerbId[] = [
  "completed", "passed", "failed", "progressed", "experienced", "initialized"
];

describe("SCORM Status Mapping Property Tests", () => {
  describe("Property 11: SCORM status → xAPI mapping", () => {
    it("should be total - every input produces a valid xAPI verb", () => {
      fc.assert(
        fc.property(arbStatusVariant, (status) => {
          const result = mapScormStatusToXapi(status);
          
          // Should always return a valid xAPI verb
          expect(result).toBeDefined();
          expect(result.id).toBeDefined();
          expect(result.iri).toBeDefined();  
          expect(result.display).toBeDefined();
          
          // Verb ID should be one of the valid ones
          expect(VALID_XAPI_VERBS).toContain(result.id);
          
          // IRI should be properly formed
          expect(result.iri).toMatch(/^http:\/\/adlnet\.gov\/expapi\/verbs\//);
          
          // Display should be non-empty
          expect(result.display.length).toBeGreaterThan(0);
        }),
        { numRuns: 200 }
      );
    });

    it("should be deterministic - same input produces same output", () => {
      fc.assert(
        fc.property(arbStatusVariant, (status) => {
          const result1 = mapScormStatusToXapi(status);
          const result2 = mapScormStatusToXapi(status);
          
          // Both calls should return identical results
          expect(result1.id).toBe(result2.id);
          expect(result1.iri).toBe(result2.iri);
          expect(result1.display).toBe(result2.display);
        }),
        { numRuns: 200 }
      );
    });

    it("should handle SCORM 1.2 and 2004 format differences consistently", () => {
      fc.assert(
        fc.property(fc.tuple(arbScorm12Status, arbScorm2004Status), ([status12, status2004]) => {
          // Skip if they're different statuses
          const normalized12 = status12.trim().toLowerCase().replace(/[\s-]+/g, "_");
          const normalized2004 = status2004.trim().toLowerCase().replace(/[\s-]+/g, "_");
          
          fc.pre(normalized12 === normalized2004);
          
          // Should produce identical xAPI verbs
          const result12 = mapScormStatusToXapi(status12);
          const result2004 = mapScormStatusToXapi(status2004);
          
          expect(result12.id).toBe(result2004.id);
        }),
        { numRuns: 100 }
      );
    });

    it("should preserve semantic mapping correctness", () => {
      fc.assert(
        fc.property(arbCanonicalScormStatus, (status) => {
          const result = mapScormStatusToXapi(status);
          
          // Verify expected semantic mappings
          switch (status) {
            case "completed":
              expect(result.id).toBe("completed");
              break;
            case "passed":
              expect(result.id).toBe("passed");
              break;
            case "failed":
              expect(result.id).toBe("failed");
              break;
            case "incomplete":
              expect(result.id).toBe("progressed");
              break;
            case "browsed":
              expect(result.id).toBe("experienced");
              break;
            case "not attempted":
            case "unknown":
              expect(result.id).toBe("initialized");
              break;
          }
        }),
        { numRuns: 100 }
      );
    });

    it("should handle whitespace and case variations correctly", () => {
      fc.assert(
        fc.property(
          arbCanonicalScormStatus,
          fc.integer({ min: 0, max: 3 }),  // Number of leading spaces
          fc.integer({ min: 0, max: 3 }),  // Number of trailing spaces  
          fc.boolean(),                    // Whether to use uppercase
          (baseStatus, leadSpaces, trailSpaces, useUpper) => {
            // Create variant with whitespace and case changes
            let variant = " ".repeat(leadSpaces) + baseStatus + " ".repeat(trailSpaces);
            if (useUpper) {
              variant = variant.toUpperCase();
            }
            
            const baseResult = mapScormStatusToXapi(baseStatus);
            const variantResult = mapScormStatusToXapi(variant);
            
            // Should produce the same xAPI verb despite formatting differences
            expect(variantResult.id).toBe(baseResult.id);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should map unknown/invalid statuses to initialized consistently", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 })
            .filter(s => {
              const normalized = s.trim().toLowerCase().replace(/[\s-]+/g, "_");
              return !["completed", "incomplete", "passed", "failed", "browsed", "not_attempted"].includes(normalized);
            }),
          (invalidStatus) => {
            const result = mapScormStatusToXapi(invalidStatus);
            
            // All invalid/unrecognized statuses should map to "initialized"
            expect(result.id).toBe("initialized");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should produce well-formed xAPI verb objects for all inputs", () => {
      fc.assert(
        fc.property(fc.string({ maxLength: 100 }), (status) => {
          const result = mapScormStatusToXapi(status);
          
          // Should have the expected shape
          expect(typeof result.id).toBe("string");
          expect(typeof result.iri).toBe("string"); 
          expect(typeof result.display).toBe("string");
          
          // IRI should start with ADL base
          expect(result.iri).toMatch(/^http:\/\/adlnet\.gov\/expapi\/verbs\/.+/);
          
          // Display should match the verb ID
          expect(result.display).toBe(result.id);
          
          // Verb ID should be valid
          expect(VALID_XAPI_VERBS).toContain(result.id);
        }),
        { numRuns: 200 }
      );
    });

    it("should handle edge cases gracefully", () => {
      // Test specific edge cases that might break the mapping
      const edgeCases = [
        "",                    // Empty string
        "   ",                // Only whitespace
        "\t\n\r",             // Various whitespace chars
        "not",                // Partial match
        "completed_extra",     // Extra content
        "NOT ATTEMPTED",      // All caps with space
        "not-attempted-test", // With extra hyphens
        "unknown_status",     // Unknown with underscore
        "🚀completed",        // With emoji
        "completed🚀",        // Emoji at end
      ];
      
      for (const testCase of edgeCases) {
        const result = mapScormStatusToXapi(testCase);
        
        // Should not throw and should return valid verb
        expect(result).toBeDefined();
        expect(VALID_XAPI_VERBS).toContain(result.id);
        expect(result.iri).toMatch(/^http:\/\/adlnet\.gov\/expapi\/verbs\/.+/);
      }
    });
  });
});