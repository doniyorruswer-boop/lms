// Kurs va ta'lim yo'nalishi
export type DirectionType = "BACHELOR" | "MASTER";

export interface Course {
  id: string;
  title: string;
  teacherId: string;
  teacherName: string;
  direction: DirectionType;
  semester: number;
  capacity: number; // talabalar soni chegarasi
  enrolledCount: number;
  progressPercent: number; // talaba uchun
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  date: string; // ISO 8601
  durationMin: number;
  videoUrl: string | null; // .m3u8
  materials: Material[];
}

export interface Material {
  id: string;
  type: "PDF" | "VIDEO" | "SCORM";
  title: string;
  url: string;
}
