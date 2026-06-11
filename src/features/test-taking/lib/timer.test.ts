/**
 * Property-based test for test timer logic.
 *
 * **Validates: Requirements 7.2, 7.5**
 * Property 13: Test taymerining qoldiq vaqt invariantlari
 */

import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import { computeRemainingMs } from './timer';

describe('computeRemainingMs', () => {
  it('Property 13: Test taymerining qoldiq vaqt invariantlari', () => {
    fc.assert(
      fc.property(
        // Generate test scenarios with start time, duration, and current time
        fc.record({
          startedAt: fc.integer({ min: 0, max: Date.now() + 86400000 }), // up to tomorrow
          durationMin: fc.float({ min: 0, max: 240 }), // 0 to 4 hours
          now: fc.integer({ min: 0, max: Date.now() + 86400000 }), // up to tomorrow
        }),
        ({ startedAt, durationMin, now }) => {
          // Precondition: now >= startedAt for meaningful test
          fc.pre(now >= startedAt);

          const remaining = computeRemainingMs(startedAt, durationMin, now);
          const expectedTotal = durationMin * 60_000;

          // Invariant 1: Result is always within [0, durationMin * 60_000]
          expect(remaining).toBeGreaterThanOrEqual(0);
          expect(remaining).toBeLessThanOrEqual(expectedTotal);

          // Invariant 2: Result is 0 if and only if now >= startedAt + durationMin * 60_000
          const deadline = startedAt + expectedTotal;
          if (now >= deadline) {
            expect(remaining).toBe(0);
          }

          // Additional consistency check: remaining + elapsed should equal total (when not exceeded)
          if (remaining > 0) {
            const elapsed = now - startedAt;
            expect(remaining + elapsed).toBeCloseTo(expectedTotal, 0);
          }

          // Test auto-submit trigger condition (when remaining === 0)
          if (remaining === 0) {
            expect(now >= startedAt + expectedTotal).toBe(true);
          }
        },
      ),
      { numRuns: 100 }
    );
  });

  it('handles edge cases properly', () => {
    fc.assert(
      fc.property(
        fc.record({
          startedAt: fc.oneof(fc.constant(NaN), fc.constant(Infinity), fc.constant(-Infinity)),
          durationMin: fc.oneof(
            fc.constant(NaN),
            fc.constant(Infinity),
            fc.constant(-Infinity),
            fc.constant(-1),
            fc.constant(0)
          ),
          now: fc.oneof(fc.constant(NaN), fc.constant(Infinity), fc.constant(-Infinity)),
        }),
        ({ startedAt, durationMin, now }) => {
          const remaining = computeRemainingMs(startedAt, durationMin, now);

          // Should handle invalid inputs gracefully
          expect(remaining).toBeGreaterThanOrEqual(0);
          expect(Number.isFinite(remaining)).toBe(true);

          // For invalid or non-positive duration, should return 0
          if (!Number.isFinite(durationMin) || durationMin <= 0) {
            expect(remaining).toBe(0);
          }
        },
      ),
      { numRuns: 100 }
    );
  });

  it('handles time travel (now < startedAt) by clamping to maximum duration', () => {
    fc.assert(
      fc.property(
        fc.record({
          startedAt: fc.integer({ min: 1000, max: Date.now() }),
          durationMin: fc.float({ min: 1, max: 60 }),
          timeDelta: fc.integer({ min: 1, max: 3600000 }), // 1ms to 1 hour before start
        }),
        ({ startedAt, durationMin, timeDelta }) => {
          const now = startedAt - timeDelta; // now < startedAt (time travel)
          const remaining = computeRemainingMs(startedAt, durationMin, now);
          const expectedTotal = durationMin * 60_000;

          // Should clamp to maximum duration when now < startedAt
          expect(remaining).toBe(expectedTotal);
        },
      ),
      { numRuns: 100 }
    );
  });
});