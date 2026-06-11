/**
 * Property-based tests for language selection round-trip integrity.
 * 
 * **Validates: Requirements 19.4**
 * Property 24: Language selection round-trip persistence
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fc from "fast-check";
import { setLanguage, loadLanguage, LANGUAGE_STORAGE_KEY } from "./language";
import type { Locale } from "@/shared/types";

/**
 * Arbitrary generator for supported locales.
 */
const arbLocale = fc.oneof(
  fc.constant("uz"),
  fc.constant("ru"),
  fc.constant("en")
) as fc.Arbitrary<Locale>;

/**
 * Mock localStorage implementation for testing isolation.
 */
class MockStorage implements Storage {
  private store: Record<string, string> = {};
  private throwError = false;
  
  get length(): number {
    return Object.keys(this.store).length;
  }
  
  clear(): void {
    this.store = {};
  }
  
  getItem(key: string): string | null {
    if (this.throwError) throw new Error("Storage access denied");
    return this.store[key] || null;
  }
  
  setItem(key: string, value: string): void {
    if (this.throwError) throw new Error("Storage access denied");
    this.store[key] = value;
  }
  
  removeItem(key: string): void {
    delete this.store[key];
  }
  
  key(index: number): string | null {
    return Object.keys(this.store)[index] || null;
  }
  
  // Test utilities
  setErrorMode(shouldThrow: boolean): void {
    this.throwError = shouldThrow;
  }
  
  getStore(): Record<string, string> {
    return { ...this.store };
  }
}

describe("Language Round-Trip Property Tests", () => {
  let mockStorage: MockStorage;
  let originalLocalStorage: Storage;
  
  beforeEach(() => {
    mockStorage = new MockStorage();
    originalLocalStorage = window.localStorage;
    
    // Replace window.localStorage with our mock
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true
    });
  });
  
  afterEach(() => {
    // Restore original localStorage
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true
    });
  });

  describe("Property 24: Round-trip persistence integrity", () => {
    it("should preserve language across setLanguage/loadLanguage cycles", () => {
      fc.assert(
        fc.property(arbLocale, (language) => {
          // Clear any existing state
          mockStorage.clear();
          
          // Set language
          setLanguage(language);
          
          // Load language - should return the exact same value
          const loaded = loadLanguage();
          expect(loaded).toBe(language);
          
          // Verify the correct key was used in storage
          expect(mockStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe(language);
        }),
        { numRuns: 100 }
      );
    });

    it("should maintain consistency across multiple set/load operations", () => {
      fc.assert(
        fc.property(
          fc.array(arbLocale, { minLength: 1, maxLength: 20 }),
          (languages) => {
            mockStorage.clear();
            
            let expectedLanguage: Locale | null = null;
            
            for (const lang of languages) {
              // Set the language
              setLanguage(lang);
              expectedLanguage = lang;
              
              // Immediately load and verify
              const loaded = loadLanguage();
              expect(loaded).toBe(expectedLanguage);
              
              // Verify storage consistency
              expect(mockStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe(expectedLanguage);
            }
            
            // Final verification that the last language is persisted
            const finalLoad = loadLanguage();
            expect(finalLoad).toBe(expectedLanguage);
          }
        ),
        { numRuns: 50 }
      );
    });

    it("should handle interleaved operations correctly", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              operation: fc.oneof(fc.constant("set"), fc.constant("load")),
              language: arbLocale
            }),
            { minLength: 1, maxLength: 30 }
          ),
          (operations) => {
            mockStorage.clear();
            let lastSetLanguage: Locale | null = null;
            
            for (const op of operations) {
              if (op.operation === "set") {
                setLanguage(op.language);
                lastSetLanguage = op.language;
              } else {
                // Load operation
                const loaded = loadLanguage();
                expect(loaded).toBe(lastSetLanguage);
              }
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it("should be idempotent - multiple sets of same value should work", () => {
      fc.assert(
        fc.property(
          arbLocale,
          fc.integer({ min: 1, max: 10 }),
          (language, iterations) => {
            mockStorage.clear();
            
            // Set the same language multiple times
            for (let i = 0; i < iterations; i++) {
              setLanguage(language);
              
              // Should always load the same value
              const loaded = loadLanguage();
              expect(loaded).toBe(language);
            }
            
            // Storage should still contain the correct value
            expect(mockStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe(language);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should handle rapid sequential operations", () => {
      fc.assert(
        fc.property(arbLocale, (baseLanguage) => {
          mockStorage.clear();
          
          // Rapid set/load cycles
          for (let i = 0; i < 100; i++) {
            setLanguage(baseLanguage);
            const loaded = loadLanguage();
            expect(loaded).toBe(baseLanguage);
          }
        }),
        { numRuns: 20 }
      );
    });

    it("should preserve data across page reload simulation", () => {
      fc.assert(
        fc.property(arbLocale, (language) => {
          // Simulate page lifecycle: set language, "reload" (new storage instance), load
          mockStorage.clear();
          
          // Set language before "reload"
          setLanguage(language);
          const storedValue = mockStorage.getItem(LANGUAGE_STORAGE_KEY);
          
          // Ensure the value was actually stored
          expect(storedValue).toBe(language);
          
          // Simulate page reload with new mock storage but same underlying data
          const newMockStorage = new MockStorage();
          if (storedValue) {
            newMockStorage.setItem(LANGUAGE_STORAGE_KEY, storedValue);
          }
          
          Object.defineProperty(window, 'localStorage', {
            value: newMockStorage,
            writable: true
          });
          
          // Load after "reload" - should return the same language
          const loadedAfterReload = loadLanguage();
          expect(loadedAfterReload).toBe(language);
        }),
        { numRuns: 100 }
      );
    });

    it("should handle storage errors gracefully without breaking round-trip", () => {
      fc.assert(
        fc.property(arbLocale, (language) => {
          mockStorage.clear();
          
          // First, set successfully
          setLanguage(language);
          expect(loadLanguage()).toBe(language);
          
          // Enable error mode for set operations
          mockStorage.setErrorMode(true);
          
          // setLanguage should not throw even when storage fails
          expect(() => setLanguage(language)).not.toThrow();
          
          // Disable error mode for load operations
          mockStorage.setErrorMode(false);
          
          // Previous value should still be there (since storage error prevented overwrite)
          expect(loadLanguage()).toBe(language);
        }),
        { numRuns: 50 }
      );
    });

    it("should handle load storage errors gracefully", () => {
      fc.assert(
        fc.property(arbLocale, (language) => {
          mockStorage.clear();
          
          // Set successfully first
          setLanguage(language);
          
          // Enable error mode for load operations
          mockStorage.setErrorMode(true);
          
          // loadLanguage should not throw and should return null
          expect(() => loadLanguage()).not.toThrow();
          expect(loadLanguage()).toBe(null);
        }),
        { numRuns: 50 }
      );
    });

    it("should work correctly when storage contains non-language values", () => {
      fc.assert(
        fc.property(
          arbLocale,
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          (language, otherKey, otherValue) => {
            fc.pre(otherKey !== LANGUAGE_STORAGE_KEY);
            
            mockStorage.clear();
            
            // Add some unrelated data to storage
            mockStorage.setItem(otherKey, otherValue);
            
            // Our language operations should not interfere
            setLanguage(language);
            expect(loadLanguage()).toBe(language);
            
            // Other data should be unaffected
            expect(mockStorage.getItem(otherKey)).toBe(otherValue);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should handle edge case: empty storage", () => {
      // Test when localStorage is completely empty
      mockStorage.clear();
      
      const loaded = loadLanguage();
      expect(loaded).toBe(null);
      
      // Set and load should still work
      setLanguage("uz");
      expect(loadLanguage()).toBe("uz");
    });

    it("should maintain type safety in round-trip", () => {
      fc.assert(
        fc.property(arbLocale, (language) => {
          mockStorage.clear();
          
          setLanguage(language);
          const loaded = loadLanguage();
          
          // Type should be preserved
          if (loaded !== null) {
            expect(typeof loaded).toBe("string");
            expect(["uz", "ru", "en"]).toContain(loaded);
          }
        }),
        { numRuns: 100 }
      );
    });

    it("should handle concurrent-like operations", () => {
      fc.assert(
        fc.property(
          fc.array(arbLocale, { minLength: 2, maxLength: 5 }),
          (languages) => {
            mockStorage.clear();
            
            // Simulate concurrent-like operations (though still synchronous)
            const results: (Locale | null)[] = [];
            
            // Batch of sets
            for (const lang of languages) {
              setLanguage(lang);
            }
            
            // Batch of loads  
            for (let i = 0; i < languages.length; i++) {
              results.push(loadLanguage());
            }
            
            // All loads should return the last set language
            const expectedLast = languages[languages.length - 1];
            for (const result of results) {
              expect(result).toBe(expectedLast);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});