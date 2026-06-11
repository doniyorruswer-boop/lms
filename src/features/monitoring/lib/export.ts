// Hisobotlarni CSV va PDF formatlarida eksport qilish yordamchilari (Req 13.6).
//
// Bu modul ikki qatlamga bo'lingan:
//   1. Toza generatorlar (`toCsv`, `toSimplePdf`) — kirish ma'lumotlaridan
//      matn/bayt hosil qiladi, hech qanday DOM yoki I/O ga bog'liq emas, shu
//      sababli alohida sinaladi.
//   2. `downloadBlob` — brauzerda faylni yuklab olishni boshlovchi yagona
//      side-effectli funksiya (DOM ga bog'liq, SSR uchun himoyalangan).

/**
 * Bitta CSV katakchasini RFC 4180 qoidalariga ko'ra ekranlaydi: agar qiymatda
 * vergul, qo'shtirnoq yoki yangi qator bo'lsa, qiymat qo'shtirnoq ichiga
 * olinadi va ichidagi qo'shtirnoqlar ikkilantiriladi.
 */
function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Sarlavhalar va qatorlardan CSV matnini hosil qiladi (toza). Qatorlar CRLF
 * (`\r\n`) bilan ajratiladi.
 */
export function toCsv(headers: readonly string[], rows: readonly (readonly string[])[]): string {
  const lines = [headers, ...rows].map((row) =>
    row.map((cell) => escapeCsvCell(cell)).join(',')
  )
  return lines.join('\r\n')
}

/**
 * Matnni PDF tarkibida xavfsiz ishlatiladigan ASCII ko'rinishiga keltiradi:
 * ASCII bo'lmagan belgilar `?` bilan almashtiriladi va PDF maxsus belgilari
 * (`(`, `)`, `\`) ekranlanadi. Bu yengil (kutubxonasiz) PDF generatori uchun
 * baytlar mosligini va to'g'ri xref ofsetlarini ta'minlaydi.
 */
function sanitizePdfText(text: string): string {
  let result = ''
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0
    if (code < 0x20 || code > 0x7e) {
      result += '?'
    } else if (char === '(' || char === ')' || char === '\\') {
      result += `\\${char}`
    } else {
      result += char
    }
  }
  return result
}

/**
 * Sarlavha va matn qatorlaridan minimal, yaroqli (PDF 1.4) hujjat hosil qiladi
 * (toza). Standart Helvetica shrifti ishlatiladi; barcha matn ASCII ga
 * keltiriladi. Natija `%PDF-` bilan boshlanadi va to'g'ri `xref` jadvaliga ega.
 */
export function toSimplePdf(title: string, lines: readonly string[]): string {
  const fontSize = 12
  const lineHeight = 16
  const startY = 800

  const textRows = [title, '', ...lines]
  const contentParts: string[] = ['BT', `/F1 ${fontSize} Tf`, `50 ${startY} Td`]
  textRows.forEach((row, index) => {
    if (index > 0) {
      contentParts.push(`0 -${lineHeight} Td`)
    }
    contentParts.push(`(${sanitizePdfText(row)}) Tj`)
  })
  contentParts.push('ET')
  const content = contentParts.join('\n')

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]

  const header = '%PDF-1.4\n'
  let body = ''
  const offsets: number[] = []
  objects.forEach((obj, index) => {
    offsets.push(header.length + body.length)
    body += `${index + 1} 0 obj\n${obj}\nendobj\n`
  })

  const xrefOffset = header.length + body.length
  const objectCount = objects.length + 1 // +1 for the free object 0
  let xref = `xref\n0 ${objectCount}\n0000000000 65535 f \n`
  offsets.forEach((offset) => {
    xref += `${offset.toString().padStart(10, '0')} 00000 n \n`
  })

  const trailer = `trailer\n<< /Size ${objectCount} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return header + body + xref + trailer
}

/** CSV eksporti uchun MIME turi (UTF-8 BOM bilan birga ishlatiladi). */
export const CSV_MIME_TYPE = 'text/csv;charset=utf-8'
/** PDF eksporti uchun MIME turi. */
export const PDF_MIME_TYPE = 'application/pdf'

/**
 * Berilgan matn tarkibini fayl sifatida yuklab olishni boshlaydi. Brauzer
 * mavjud bo'lmagan muhitda (masalan, SSR) hech narsa qilmaydi.
 *
 * @param filename Yuklab olinadigan fayl nomi (kengaytma bilan).
 * @param content Fayl tarkibi.
 * @param mimeType Fayl MIME turi.
 */
export function downloadBlob(filename: string, content: string, mimeType: string): void {
  if (typeof document === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return
  }

  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}
