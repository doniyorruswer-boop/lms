// Hisobotlar moduli uchun tiplar.
//
// Bu modul Reports_Module (Req 17) uchun TypeScript tiplarini e'lon qiladi.
// Hisobot turlari, filtrlar va eksport formatlarini qamrab oladi.

/** Hisobot turlari (Req 17.1) */
export type ReportType = 'attendance' | 'grades' | 'progress' | 'certificates'

/** Eksport formatlari (Req 17.4) */
export type ExportFormat = 'csv' | 'pdf'

/** Hisobot filtrlari (Req 17.2) */
export interface ReportFilters {
  /** Sana oralig'i boshlang'ich sanasi */
  startDate?: string
  /** Sana oralig'i yakuniy sanasi */
  endDate?: string
  /** Fakultet ID si */
  facultyId?: string
  /** Ta'lim yo'nalishi */
  direction?: 'BACHELOR' | 'MASTER'
  /** Kurs ID si */
  courseId?: string
}

/** Hisobot ma'lumotlari */
export interface ReportData {
  /** Hisobot turi */
  type: ReportType
  /** Hisobot nomi */
  name: string
  /** Hisobot tavsifi */
  description: string
  /** Hisobot ma'lumotlari (generik) */
  data: unknown[]
  /** Yaratilgan sana */
  generatedAt: string
  /** Qo'llangan filtrlar */
  filters: ReportFilters
}

/** Hisobot eksport holati */
export interface ExportStatus {
  /** Eksport ID si */
  id: string
  /** Eksport holati */
  status: 'pending' | 'processing' | 'completed' | 'error'
  /** Eksport formati */
  format: ExportFormat
  /** Progress foizi */
  progress: number
  /** Yuklab olish URL si (tayyor bo'lganda) */
  downloadUrl?: string
  /** Xato xabari (xato bo'lsa) */
  error?: string
}

/** Davomat hisoboti ma'lumoti */
export interface AttendanceReportRow {
  studentName: string
  courseTitle: string
  totalLessons: number
  attendedLessons: number
  attendancePercentage: number
  lastAttendance?: string
}

/** Baholash hisoboti ma'lumoti */
export interface GradesReportRow {
  studentName: string
  courseTitle: string
  assessmentTitle: string
  maxScore: number
  score: number
  submittedAt: string
  percentage: number
}

/** Progress hisoboti ma'lumoti */
export interface ProgressReportRow {
  studentName: string
  courseTitle: string
  lessonsCompleted: number
  totalLessons: number
  progressPercentage: number
  lastActivity?: string
}

/** Sertifikat hisoboti ma'lumoti */
export interface CertificatesReportRow {
  studentName: string
  courseTitle: string
  certificateNumber: string
  issuedAt: string
  isVerified: boolean
}

/** Fakultet ma'lumoti (filter uchun) */
export interface Faculty {
  id: string
  name: string
}

/** Kurs ma'lumoti (filter uchun) */
export interface CourseOption {
  id: string
  title: string
  facultyId: string
}
