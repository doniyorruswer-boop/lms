// HEMIS sinxronizatsiya
export type SyncStatus = "started" | "running" | "completed" | "error";
export type SyncType = "students" | "teachers" | "courses";

export interface SyncJob {
  id: string;
  type: SyncType;
  status: SyncStatus;
  processed: number;
  created: number;
  errors: number;
  startedAt: string;
  finishedAt: string | null;
  /**
   * Qayta ishlanishi kerak bo'lgan yozuvlarning umumiy soni. Progress barni
   * `computeProgressPct(processed, total)` orqali hisoblash uchun ishlatiladi
   * (Req 12.3). Backend uni hali bilmasligi mumkin, shuning uchun ixtiyoriy.
   */
  total?: number;
  /**
   * `status === "error"` bo'lganda xato sababi (Req 12.6). To'liq loglar
   * alohida endpoint orqali yuklab olinadi.
   */
  errorMessage?: string | null;
}
