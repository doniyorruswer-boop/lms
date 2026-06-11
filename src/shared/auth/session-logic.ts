/**
 * Pure, side-effect-free session-expiry logic.
 *
 * The session timeout hook (Req 1.9) logs the user out after a fixed idle
 * period. The expiry decision is isolated here as a pure function so it can be
 * covered by property-based tests independently of any timers or DOM events.
 *
 * See design.md "Property 6: Sessiya muddatini hisoblash":
 *   computeIsExpired(lastActivityAt, now, threshold) === ((now - lastActivityAt) > threshold)
 */

/** Idle threshold in milliseconds before a session expires: 30 minutes. */
export const THRESHOLD = 30 * 60 * 1000

/**
 * Decide whether a session has expired given the last activity timestamp and
 * the current time, both in epoch milliseconds.
 *
 * The session is considered expired when the elapsed idle time strictly exceeds
 * `threshold`. At exactly `threshold` the session is still active.
 *
 * @param lastActivityAt - Epoch ms of the most recent user activity.
 * @param now - Epoch ms representing the current time.
 * @param threshold - Idle threshold in ms (defaults to {@link THRESHOLD}).
 * @returns `true` when `(now - lastActivityAt) > threshold`, otherwise `false`.
 */
export function computeIsExpired(
  lastActivityAt: number,
  now: number,
  threshold: number = THRESHOLD,
): boolean {
  return now - lastActivityAt > threshold
}
