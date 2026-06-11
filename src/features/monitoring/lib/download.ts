/**
 * Browser-side file download helpers for the Monitoring_Panel export feature
 * (Req 13.6). These are thin DOM side-effect wrappers kept separate from the
 * pure CSV builders so the serialization logic stays unit-testable.
 */

/**
 * Trigger a client-side download of `content` as a UTF-8 CSV file.
 *
 * A BOM (`\uFEFF`) is prepended so spreadsheet apps detect UTF-8 and render
 * Cyrillic/Latin text correctly.
 */
export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([`\uFEFF${content}`], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

/**
 * Trigger PDF export. The backend renders the authoritative PDF report, so we
 * open the export endpoint in a new tab; when the browser cannot open a window
 * (e.g. popup blocked) we fall back to the print dialog (Req 13.6).
 */
export function exportPdf(exportUrl: string): void {
  const opened = window.open(exportUrl, '_blank', 'noopener,noreferrer')
  if (!opened) {
    window.print()
  }
}
