/**
 * Pure, side-effect-free exponential backoff helpers.
 *
 * These functions produce deterministic delay schedules used by the WebSocket
 * reconnect logic (Req 16.5) and the 5xx retry interceptor (Req 21.4). They are
 * isolated as pure functions so they can be covered by property-based tests.
 *
 * See design.md "Property 23: Eksponensial backoff ketma-ketligi".
 */

/** Reconnect delay schedule in milliseconds: 1s, 2s, 4s, 8s, 16s (capped). */
const RECONNECT_DELAYS_MS = [1000, 2000, 4000, 8000, 16000] as const

/** 5xx retry delay schedule in milliseconds: 300ms, 900ms, 2700ms (capped). */
const RETRY_5XX_DELAYS_MS = [300, 900, 2700] as const

/**
 * Look up the delay for an arbitrary attempt index `n` against a fixed table.
 *
 * The index is clamped into range: negative or non-finite inputs collapse to
 * the first entry, fractional values are floored, and `n` beyond the table is
 * capped at the last entry. This guarantees a nondecreasing schedule that never
 * returns a value outside the table.
 */
function delayAt(table: readonly number[], n: number): number {
  const lastIndex = table.length - 1
  if (!Number.isFinite(n) || n <= 0) {
    return table[0]!
  }
  const idx = Math.min(Math.floor(n), lastIndex)
  return table[idx]!
}

/**
 * Delay (ms) before the n-th WebSocket reconnect attempt.
 *
 * Follows the table [1000, 2000, 4000, 8000, 16000]; for `n >= 4` the value is
 * capped at 16000. The sequence is nondecreasing in `n` and never returns a
 * value outside the table.
 */
export function computeReconnectDelay(n: number): number {
  return delayAt(RECONNECT_DELAYS_MS, n)
}

/**
 * Delay (ms) before the n-th 5xx retry attempt.
 *
 * Follows the table [300, 900, 2700]; for `n >= 2` the value is capped at 2700.
 * The sequence is nondecreasing in `n` and never returns a value outside the
 * table.
 */
export function compute5xxRetryDelay(n: number): number {
  return delayAt(RETRY_5XX_DELAYS_MS, n)
}
