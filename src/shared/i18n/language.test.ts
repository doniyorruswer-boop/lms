/**
 * Property-based tests for i18n language resolution and persistence.
 * 
 * Tests Properties 24 and 25 from the design document:
 * - Property 24: Language selection round-trip persistence  
 * - Property 25: Language fallback resolution rules
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fc from "fast-check";
import { 
  resolveInitialLanguage, 
  setLanguage, 
  loadLanguage, 
  LANGUAGE_STORAGE_KEY 
} from "./language";
import type { Locale } from "@/shared/types";

/**
 * Arbitrary generator for supported locales.
 */
const arbSupportedLocale = fc.oneof(
  fc.constant("uz"),
  fc.constant("ru"), 
  fc.constant("en")
) as fc.Arbitrary<Locale>;

/**
 * Arbitrary generator for unsupported locale strings.
 */
const arbUnsupportedLocale = fc.string({ minLength: 1, maxLength: 10 })
  .filter(s => !["uz", "ru", "en"].includes(s));

/**
 * Arbitrary generator for potentially null/undefined locale values.
 */
const arbMaybeLocale = fc.oneof(
  arbSupportedLocale,
  arbUnsupportedLocale,
  fc.constant(null),
  fc.constant(undefined)
);

/**
 * Mock localStorage for testing
 */
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn(),
    length: 0
  };
})();

describe("Language Resolution Property Tests", () => {
  beforeEach(() => {
    // Setup localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Property 25: Language fallback resolution rules", () => {
    it("should follow fallback hierarchy: stored → browser → default", () => {
      fc.assert(
        fc.property(
          arbMaybeLocale,  // stored value
          arbMaybeLocale,  // browser value  
          (stored, browser) => {
            const result = resolveInitialLanguage(stored, browser);
            
            // Result should always be a supported locale
            expect(["uz", "ru", "en"]).toContain(result);
            
            // Check fallback logic
            if (stored && ["uz", "ru", "en"].includes(stored)) {
              // If stored is valid, it should be used
              expect(result).toBe(stored);
            } else if (browser && ["uz", "ru", "en"].includes(browser)) {
              // If stored invalid but browser valid, use browser
              expect(result).toBe(browser);
            } else {
              // Both invalid, should default to 'uz'
              expect(result).toBe("uz");
            }
          }
        ),
        { numRuns: 200 }
      );
    });

    it("should handle null/undefined inputs gracefully", () => {
      fc.assert(
        fc.property(
          fc.oneof(fc.constant(null), fc.constant(undefined)),
          fc.oneof(fc.constant(null), fc.constant(undefined)), 
          (stored, browser) => {
            const result = resolveInitialLanguage(stored, browser);
            
            // Should always default to 'uz' when both inputs are null/undefined
            expect(result).toBe("uz");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should be deterministic for identical inputs", () => {
      fc.assert(
        fc.property(arbMaybeLocale, arbMaybeLocale, (stored, browser) => {
          const result1 = resolveInitialLanguage(stored, browser);
          const result2 = resolveInitialLanguage(stored, browser);
          
          // Should always return the same result for same inputs
          expect(result1).toBe(result2);
        }),
        { numRuns: 100 }
      );
    });

    it("should prioritize stored over browser regardless of values", () => {
      fc.assert(
        fc.property(arbSupportedLocale, arbSupportedLocale, (stored, browser) => {
          fc.pre(stored !== browser); // Only test when they're different
          
          const result = resolveInitialLanguage(stored, browser);
          
          // Stored should always win when both are valid
          expect(result).toBe(stored);
        }),
        { numRuns: 100 }
      );
    });

    it("should handle mixed valid/invalid combinations correctly", () => {
      fc.assert(
        fc.property(
          fc.oneof(arbSupportedLocale, arbUnsupportedLocale),
          fc.oneof(arbSupportedLocale, arbUnsupportedLocale),
          (stored, browser) => {
            const result = resolveInitialLanguage(stored, browser);
            
            const isStoredValid = ["uz", "ru", "en"].includes(stored);
            const isBrowserValid = ["uz", "ru", "en"].includes(browser);
            
            if (isStoredValid) {
              expect(result).toBe(stored);
            } else if (isBrowserValid) {
              expect(result).toBe(browser);
            } else {
              expect(result).toBe("uz");
            }
          }
        ),
        { numRuns: 200 }
      );
    });
  });

  describe("Property 24: Language selection round-trip persistence", () => {
    it("should persist and retrieve language selections correctly", () => {
      fc.assert(
        fc.property(arbSupportedLocale, (language) => {
          // Clear any existing value
          mockLocalStorage.clear();
          
          // Set the language
          setLanguage(language);
          
          // Should have called localStorage.setItem with correct parameters
          expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
            LANGUAGE_STORAGE_KEY,
            language
          );
          
          // Load should return the same language
          const loaded = loadLanguage();
          expect(loaded).toBe(language);
        }),
        { numRuns: 100 }
      );
    });

    it("should return null when no language is stored", () => {
      fc.assert(
        fc.property(fc.constant(null), (_) => {
          // Clear storage
          mockLocalStorage.clear();
          
          // Load should return null when nothing stored
          const loaded = loadLanguage();
          expect(loaded).toBe(null);
        }),
        { numRuns: 10 }
      );
    });

    it("should return null for invalid stored values", () => {
      fc.assert(
        fc.property(arbUnsupportedLocale, (invalidValue) => {
          // Manually set invalid value in storage
          mockLocalStorage.setItem(LANGUAGE_STORAGE_KEY, invalidValue);
          
          // Load should return null for invalid values  
          const loaded = loadLanguage();
          expect(loaded).toBe(null);
        }),
        { numRuns: 100 }
      );
    });

    it("should handle localStorage errors gracefully", () => {
      fc.assert(
        fc.property(arbSupportedLocale, (language) => {
          // Mock localStorage to throw errors
          const throwingStorage = {
            setItem: vi.fn(() => { throw new Error("Storage error"); }),
            getItem: vi.fn(() => { throw new Error("Storage error"); })
          };
          
          Object.defineProperty(window, 'localStorage', {
            value: throwingStorage,
            writable: true
          });
          
          // setLanguage should not throw
          expect(() => setLanguage(language)).not.toThrow();
          
          // loadLanguage should return null and not throw
          expect(() => loadLanguage()).not.toThrow();
          expect(loadLanguage()).toBe(null);
        }),
        { numRuns: 50 }
      );
    });

    it("should maintain consistency across multiple set/load cycles", () => {
      fc.assert(
        fc.property(
          fc.array(arbSupportedLocale, { minLength: 1, maxLength: 10 }),
          (languages) => {
            mockLocalStorage.clear();
            
            let lastSet: Locale | null = null;
            
            // Set each language and verify it's loaded correctly
            for (const lang of languages) {
              setLanguage(lang);
              lastSet = lang;
              
              const loaded = loadLanguage();
              expect(loaded).toBe(lastSet);
            }
            
            // Final load should return the last set language
            expect(loadLanguage()).toBe(lastSet);
          }
        ),
        { numRuns: 50 }
      );
    });

    it("should handle edge cases in storage values", () => {
      const edgeCases = [
        "",           // Empty string
        "   ",        // Whitespace only
        "UZ",         // Wrong case
        "uz-UZ",      // With country code
        "ru_RU",      // Different format
        "english",    // Full name instead of code
        "undefined",  // String 'undefined'
        "null",       // String 'null'
        "123",        // Numbers
        JSON.stringify({ lang: "uz" }), // JSON object
      ];
      
      for (const edgeCase of edgeCases) {
        mockLocalStorage.clear();
        mockLocalStorage.setItem(LANGUAGE_STORAGE_KEY, edgeCase);
        
        const loaded = loadLanguage();
        
        // All edge cases should return null since they're not valid locales
        expect(loaded).toBe(null);
      }
    });

    it("should work with the complete resolution flow", () => {
      fc.assert(
        fc.property(arbSupportedLocale, arbMaybeLocale, (setLang, browserLang) => {
          // Clear storage and set a language
          mockLocalStorage.clear();
          setLanguage(setLang);
          
          // Load it back
          const stored = loadLanguage();
          
          // Resolve using the loaded value and browser
          const resolved = resolveInitialLanguage(stored, browserLang);
          
          // Should resolve to the stored language since it's valid
          expect(resolved).toBe(setLang);
        }),
        { numRuns: 100 }
      );
    });
  });
});