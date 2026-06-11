// Test va baholash
export interface Assessment {
  id: string;
  courseId: string;
  type: "TEST" | "ASSIGNMENT";
  title: string;
  timerMinutes: number;
  proctoringRequired: boolean;
  questions: Question[];
}

export interface Question {
  id: string;
  text: string;
  options: { id: string; text: string }[];
  points: number;
}

export interface AnswerDraft {
  questionId: string;
  selectedOptionId: string | null;
  markedForReview: boolean;
}
