/**
 * Pure, side-effect-free test timer logic.
 *
 * `computeRemainingMs` derives the remaining countdown time for a timed test
 * from its start instant, configured duration, and the current instant. It is
 * isolated as a pure function so it can be covered by property-based tests and
 * consumed by the Test_Module UI (countdown + auto-submit on expiry).
 *
 * See design.md "Property 13: Test taymerining qoldiq vaqt invariantlari".
 * Requirements: 7.2 (countdown timer), 7.5 (auto-submit when timer hits 0).
 */

/** Milliseconds in one minute. */
const MS_PER_MINUTE = 60_000

/**
 * Compute the remaining time (in milliseconds) for a timed test.
 *
 * Invariants (for `now >= startedAt`):
 * - The result is always within `[0, durationMin * 60_000]`.
 * - The result is `0` if and only if `now >= startedAt + durationMin * 60_000`.
 *
 * When the result reaches `0` the caller triggers auto-submit (Req 7.5).
 *
 * Inputs are defended for robustness: a non-positive or non-finite duration
 * yields a total of `0` (and therefore `0` remaining), and the result is
 * clamped so that a `now` earlier than `startedAt` still returns at most the
 * full duration.
 *
 * @param startedAt   Epoch milliseconds when the test was started.
 * @param durationMin Test duration in minutes.
 * @param now         Current epoch milliseconds.
 * @returns Remaining milliseconds, clamped to `[0, durationMin * 60_000]`.
 */
export function computeRemainingMs(
  startedAt: number,
  durationMin: number,
  now: number,
): number {
  const totalMs =
    Number.isFinite(durationMin) && durationMin > 0
      ? durationMin * MS_PER_MINUTE
      : 0

  if (!Number.isFinite(startedAt) || !Number.isFinite(now)) {
    return totalMs
  }

  const elapsedMs = now - startedAt
  const remainingMs = totalMs - elapsedMs

  // Clamp into [0, totalMs].
  if (remainingMs <= 0) return 0
  if (remainingMs >= totalMs) return totalMs
  return remainingMs
}
