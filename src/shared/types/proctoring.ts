// Proktoring
export type ProctoringEventType = "ok" | "violation" | "tab_switch";

export interface ProctoringEvent {
  assessmentId: string;
  type: ProctoringEventType;
  faceCount: number;
  timestamp: number;
}
