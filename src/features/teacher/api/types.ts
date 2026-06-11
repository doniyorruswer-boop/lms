// Teacher_Panel uchun maxsus ko'rinish (view) modellari (Req 10).
//
// Bu tiplar backend REST API javoblariga mos keladi, ammo faqat o'qituvchi
// paneli kontekstida ishlatiladi — shu sababli `shared/types` o'rniga feature
// ichida e'lon qilinadi.

/**
 * Talaba ishi (topshiriq/test natijasi) — o'qituvchi baholaydigan birlik
 * (Req 10.5).
 */
export interface Submission {
  /** Ish identifikatori. */
  id: string
  /** Tegishli baholash (assessment) identifikatori. */
  assessmentId: string
  /** Talaba identifikatori. */
  studentId: string
  /** Talabaning to'liq ismi. */
  studentName: string
  /** Topshirilgan vaqt (ISO 8601). */
  submittedAt: string
  /** Talaba yuborgan ish matni (topshiriq uchun); test bo'lsa `null`. */
  answerText: string | null
  /** Ushbu ish uchun maksimal ball. */
  maxPoints: number
  /** Qo'yilgan ball; hali baholanmagan bo'lsa `null`. */
  score: number | null
  /** O'qituvchi izohi; bo'lmasa `null`. */
  comment: string | null
  /** Ish baholanganmi (`score` qo'yilganmi). */
  graded: boolean
}
