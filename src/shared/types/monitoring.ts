// Monitoring
import type { DirectionType } from "./course";

export interface OtmStats {
  otmId: string;
  otmName: string;
  studentCount: number;
  teacherCount: number;
  courseCount: number;
  ratio: number; // talaba / o'qituvchi
}

/**
 * Kontingent statistikasi — bitta OTM uchun ta'lim yo'nalishi (Bachelor/Master)
 * bo'yicha taqsimlangan talabalar soni (Req 13.4). Monitoring panelidagi
 * kontingent diagrammasi shu ma'lumotlar asosida quriladi.
 */
export interface ContingentStat {
  otmId: string;
  otmName: string;
  /** Bakalavriat talabalari soni. */
  bachelorCount: number;
  /** Magistratura talabalari soni. */
  masterCount: number;
}

/** Bitta ta'lim yo'nalishidagi kontingent ulushi (diagramma segmenti). */
export interface ContingentDirectionSlice {
  direction: DirectionType;
  count: number;
}
