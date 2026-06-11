// Davomat
export interface AttendanceRecord {
  id: string;
  courseId: string;
  courseTitle: string;
  date: string;
  checkInAt: string | null;
  checkOutAt: string | null;
}
