// Shikoyat
export type ComplaintStatus = "new" | "in_review" | "answered" | "closed";

export interface Complaint {
  id: string;
  number: string;
  category: string;
  courseId: string | null;
  text: string;
  status: ComplaintStatus;
  createdAt: string;
  response: string | null;
}
