/**
 * Pure, side-effect-free HEMIS synchronisation progress helpers.
 *
 * Backs the HEMIS_Sync_UI progress bar (Req 12.3), which polls the backend
 * every 5 seconds and renders the share of processed records as a percentage.
 * Isolated as a pure function so it can be covered by property-based tests.
 *
 * See design.md "Property 19: Sinxronizatsiya progress foizi clamp".
 */

/**
 * Compute the synchronisation progress as a percentage in the inclusive
 * `[0, 100]` range.
 *
 * Contract (design.md Property 19):
 * - The result is always within `[0, 100]`.
 * - When `total === 0` the progress is defined as `0` (nothing to process, so
 *   no division by zero leaks into the UI).
 * - When `processed === total` (and `total > 0`) the result is exactly `100`.
 *
 * Non-finite or negative inputs are sanitised so the bar never renders `NaN`
 * or an out-of-range width. `processed` is clamped to `[0, total]` before the
 * ratio is taken, guarding against a stale poll reporting more processed
 * records than the known total.
 */
export function computeProgressPct(processed: number, total: number): number {
  const safeTotal = Number.isFinite(total) && total > 0 ? total : 0
  if (safeTotal === 0) {
    return 0
  }

  const safeProcessed = Number.isFinite(processed) ? processed : 0
  const clampedProcessed = Math.min(Math.max(safeProcessed, 0), safeTotal)

  if (clampedProcessed === safeTotal) {
    return 100
  }

  const pct = (clampedProcessed / safeTotal) * 100
  // Guard the upper/lower bounds explicitly so floating-point rounding can
  // never push the value outside [0, 100].
  return Math.min(Math.max(pct, 0), 100)
}
