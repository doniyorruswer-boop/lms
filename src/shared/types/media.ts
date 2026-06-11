// Video progress
export interface VideoProgress {
  lessonId: string;
  positionSec: number;
  updatedAt: number;
}

// SCORM
export type ScormStatus =
  | "not_attempted"
  | "incomplete"
  | "completed"
  | "passed"
  | "failed";
