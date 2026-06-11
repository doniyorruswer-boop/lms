// O'qituvchi — dars bo'yicha davomat sahifasi (Req 18.4; 9.5).
//
// Route paramidan `courseId` ni olib, `CourseAttendance` komponentiga uzatadi.

import { useParams } from "react-router-dom";

import { CourseAttendance } from "@/features/attendance";

/**
 * Tanlangan kurs uchun davomat ko'rinishini ko'rsatadi.
 */
export function TeacherCourseAttendancePage() {
  const { courseId = "" } = useParams<{ courseId: string }>();
  return (
    <div className="p-6">
      <CourseAttendance courseId={courseId} />
    </div>
  );
}

export default TeacherCourseAttendancePage;
