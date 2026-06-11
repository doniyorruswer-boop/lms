// Shared backend API ma'lumot tiplari uchun barrel eksport.
// Tiplar mavzu bo'yicha alohida fayllarga ajratilgan; bu yerda yagona kirish nuqtasi.

// Autentifikatsiya va rollar
export type { Role, JwtTokens, UserProfile } from "./auth";

// Kurs va ta'lim yo'nalishi
export type { DirectionType, Course, Lesson, Material } from "./course";

// Test va baholash
export type { Assessment, Question, AnswerDraft } from "./assessment";

// Proktoring
export type { ProctoringEventType, ProctoringEvent } from "./proctoring";

// Davomat
export type { AttendanceRecord } from "./attendance";

// Video progress va SCORM
export type { VideoProgress, ScormStatus } from "./media";

// HEMIS sinxronizatsiya
export type { SyncStatus, SyncType, SyncJob } from "./sync";

// Monitoring
export type {
  OtmStats,
  ContingentStat,
  ContingentDirectionSlice,
} from "./monitoring";

// Sertifikat
export type { Certificate } from "./certificate";

// Shikoyat
export type { ComplaintStatus, Complaint } from "./complaint";

// Bildirishnoma
export type { AppNotification } from "./notification";

// Marshrut himoyasi konfiguratsiyasi
export type { RouteGuardConfig } from "./routing";

// API xato modeli va sahifalangan javob
export type { ApiError, Paginated } from "./api";

// Til (locale) modeli
export type { Locale } from "./locale";
export { DEFAULT_LOCALE } from "./locale";
