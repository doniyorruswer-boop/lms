/**
 * Pure, side-effect-free CSV serialization helpers for the Monitoring_Panel
 * export feature (Req 13.6 — CSV eksport).
 *
 * The functions here only build CSV *text*; the actual browser download
 * (Blob + anchor click) is handled separately in the component layer so this
 * module stays pure and unit-testable.
 */

import type { ContingentStat, OtmStats } from '@/shared/types'

/**
 * Escape a single CSV field per RFC 4180.
 *
 * A field is wrapped in double quotes when it contains a comma, a double
 * quote, or a line break; embedded double quotes are doubled.
 */
export function escapeCsvField(value: string | number): string {
  const str = String(value)
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Build a CSV document from a header row and data rows.
 *
 * Rows are joined with CRLF (`\r\n`) line endings for maximum spreadsheet
 * compatibility. Every field is escaped via {@link escapeCsvField}.
 */
export function buildCsv(
  headers: readonly string[],
  rows: readonly (readonly (string | number)[])[],
): string {
  const lines = [headers, ...rows].map((row) =>
    row.map(escapeCsvField).join(','),
  )
  return lines.join('\r\n')
}

/**
 * Serialize per-OTM ratio statistics to CSV (Req 13.2, 13.6).
 *
 * Columns: OTM, students, teachers, courses, ratio.
 */
export function buildOtmStatsCsv(
  stats: readonly OtmStats[],
  headers: readonly [string, string, string, string, string],
): string {
  const rows = stats.map((s) => [
    s.otmName,
    s.studentCount,
    s.teacherCount,
    s.courseCount,
    s.ratio,
  ])
  return buildCsv(headers, rows)
}

/**
 * Serialize contingent statistics (by direction/OTM) to CSV (Req 13.4, 13.6).
 *
 * Columns: OTM, bachelor, master.
 */
export function buildContingentCsv(
  stats: readonly ContingentStat[],
  headers: readonly [string, string, string],
): string {
  const rows = stats.map((s) => [s.otmName, s.bachelorCount, s.masterCount])
  return buildCsv(headers, rows)
}
