/**
 * Pure, side-effect-free media position helpers.
 *
 * These functions back the Video_Player resume/seek behaviour (Req 4.4, 4.6)
 * and the PDF_Viewer page navigation (Req 5.2). They are isolated as pure
 * functions so they can be covered by property-based tests.
 *
 * See design.md "Property 7: Video davom ettirish o'rni tanlovi" and
 * "Property 8: Klaviatura seek va PDF sahifa clamp invariant".
 */

/**
 * Clamp `value` into the inclusive range `[min, max]`.
 *
 * Non-finite inputs collapse to `min` so callers never observe `NaN`/`Infinity`
 * leaking into player state. If `max < min` the result is `min`.
 */
function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min
  }
  if (value < min) {
    return min
  }
  if (value > max) {
    return max
  }
  return value
}

/**
 * Choose the position from which video playback should resume.
 *
 * Picks the furthest of the locally tracked position and the server-persisted
 * position (`max(local, remote)`), then clamps the result into the valid
 * `[0, duration]` range so a stale or out-of-range value can never seek past
 * the end of the lesson (Req 4.4).
 */
export function chooseResumePosition(
  local: number,
  remote: number,
  duration: number,
): number {
  const safeLocal = Number.isFinite(local) ? local : 0
  const safeRemote = Number.isFinite(remote) ? remote : 0
  return clamp(Math.max(safeLocal, safeRemote), 0, duration)
}

/**
 * Apply a relative seek (`delta` seconds) to the current playback time and
 * clamp the result into `[0, duration]`.
 *
 * Used by the keyboard shortcuts (←/→ = 5s back/forward, Req 4.6); positive
 * `delta` seeks forward, negative seeks backward. The result never leaves the
 * `[0, duration]` range.
 */
export function clampSeek(
  currentTime: number,
  duration: number,
  delta: number,
): number {
  const safeCurrent = Number.isFinite(currentTime) ? currentTime : 0
  const safeDelta = Number.isFinite(delta) ? delta : 0
  return clamp(safeCurrent + safeDelta, 0, duration)
}

/**
 * Clamp a target PDF page into the valid `[1, total]` range (Req 5.2).
 *
 * Pages are 1-indexed, so the lower bound is `1`. When `total < 1` the result
 * is `1`. Fractional inputs are floored to land on a concrete page.
 */
export function clampPage(page: number, total: number): number {
  const maxPage = Number.isFinite(total) && total >= 1 ? Math.floor(total) : 1
  if (!Number.isFinite(page)) {
    return 1
  }
  return clamp(Math.floor(page), 1, maxPage)
}
