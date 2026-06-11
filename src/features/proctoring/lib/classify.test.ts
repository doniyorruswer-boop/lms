/**
 * Property-based test for face detection classification logic.
 *
 * **Validates: Requirements 8.4**
 * Property 16: Yuz aniqlash natijasini hodisaga klassifikatsiya qilish
 */

import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import { classifyFaceDetection, type FaceDetectionResult } from './classify';

describe('classifyFaceDetection', () => {
  it('Property 16: Yuz aniqlash natijasini hodisaga klassifikatsiya qilish', () => {
    fc.assert(
      fc.property(
        // Generate arrays of various lengths with any content (classification only depends on length)
        fc.array(fc.anything(), { minLength: 0, maxLength: 10 }),
        (faces) => {
          const result = classifyFaceDetection(faces);
          const count = faces.length;

          // Mapping must be deterministic and complete
          if (count === 0) {
            expect(result).toBe('face_missing');
          } else if (count === 1) {
            expect(result).toBe('face_ok');
          } else if (count >= 2) {
            expect(result).toBe('multi_face');
          }

          // Result must always be one of the three valid values
          const validResults: FaceDetectionResult[] = ['face_missing', 'face_ok', 'multi_face'];
          expect(validResults).toContain(result);
        },
      ),
      { numRuns: 100 }
    );
  });

  it('is deterministic for same input', () => {
    fc.assert(
      fc.property(
        fc.array(fc.anything(), { minLength: 0, maxLength: 20 }),
        (faces) => {
          const result1 = classifyFaceDetection(faces);
          const result2 = classifyFaceDetection(faces);
          
          // Same input should always produce same output
          expect(result1).toBe(result2);
        },
      ),
      { numRuns: 100 }
    );
  });

  it('only depends on array length, not content', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10 }),
        (length) => {
          // Create two arrays of same length with different content
          const faces1 = Array(length).fill('dummy-face-object');
          const faces2 = Array(length).fill({ x: 100, y: 200, confidence: 0.95 });
          
          const result1 = classifyFaceDetection(faces1);
          const result2 = classifyFaceDetection(faces2);
          
          // Results should be identical since only length matters
          expect(result1).toBe(result2);
        },
      ),
      { numRuns: 100 }
    );
  });

  it('covers all boundary conditions', () => {
    // Test exact boundary values
    expect(classifyFaceDetection([])).toBe('face_missing'); // 0 faces
    expect(classifyFaceDetection(['face1'])).toBe('face_ok'); // exactly 1 face
    expect(classifyFaceDetection(['face1', 'face2'])).toBe('multi_face'); // exactly 2 faces
    
    // Test larger numbers
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 100 }),
        (count) => {
          const faces = Array(count).fill(null);
          const result = classifyFaceDetection(faces);
          expect(result).toBe('multi_face');
        },
      ),
      { numRuns: 50 }
    );
  });

  it('handles edge cases with different array types', () => {
    // Empty readonly array
    expect(classifyFaceDetection([] as const)).toBe('face_missing');
    
    // Readonly array with elements
    expect(classifyFaceDetection(['face'] as const)).toBe('face_ok');
    
    // Array-like objects (should still work due to readonly unknown[] type)
    const arrayLike = { length: 3, 0: 'face1', 1: 'face2', 2: 'face3' } as any;
    // This would not work with current typing, but testing the principle
    expect(classifyFaceDetection([1, 2, 3])).toBe('multi_face');
  });

  it('maintains consistency under property transformation', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({
          x: fc.float(),
          y: fc.float(), 
          confidence: fc.float({ min: 0, max: 1 })
        }), { minLength: 0, maxLength: 8 }),
        (faceObjects) => {
          // Test that mapping only cares about count, not object structure
          const result1 = classifyFaceDetection(faceObjects);
          const result2 = classifyFaceDetection(faceObjects.map(() => ({})));
          
          expect(result1).toBe(result2);
          
          // Test specific logic for proctoring requirements
          const count = faceObjects.length;
          if (count === 0) {
            // No face detected - violation for proctoring
            expect(result1).toBe('face_missing');
          } else if (count === 1) {
            // Exactly one face - normal proctoring condition
            expect(result1).toBe('face_ok');
          } else {
            // Multiple faces - potential violation (multiple people)
            expect(result1).toBe('multi_face');
          }
        },
      ),
      { numRuns: 100 }
    );
  });
});