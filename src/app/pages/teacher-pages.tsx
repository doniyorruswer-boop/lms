// O'qituvchi paneli navigatsiya hub sahifalari (Req 18.1, 18.3, 18.4).
//
// `TeacherCourseHub` ni turli maqsadlar uchun qayta ishlatadi:
//   - Kurslar   → kurs tafsilotiga (`/teacher/courses/:id`)
//   - Baholash  → kurs tafsilotidagi baholashlar tabiga
//   - Davomat   → dars bo'yicha davomat (`/teacher/courses/:id/attendance`)

import { useTranslation } from "react-i18next";

import { TeacherCourseHub } from "./teacher-course-hub";

/** O'qituvchining kurslar ro'yxati (kurs tafsilotiga o'tish). */
export function TeacherCoursesPage() {
  const { t } = useTranslation();
  return (
    <TeacherCourseHub
      title={t("nav.courses")}
      description={t("teacher.coursesHub.description", "Kursni boshqarish uchun tanlang.")}
      linkFor={(id) => `/teacher/courses/${id}`}
    />
  );
}

/** Baholash uchun kurs tanlash (kurs tafsilotidagi baholashlar tabiga o'tadi). */
export function TeacherGradingPage() {
  const { t } = useTranslation();
  return (
    <TeacherCourseHub
      title={t("nav.grading")}
      description={t("teacher.gradingHub.description", "Ishlarni baholash uchun kursni tanlang.")}
      linkFor={(id) => `/teacher/courses/${id}`}
    />
  );
}

/** Davomat uchun kurs tanlash (dars bo'yicha davomatga o'tadi). */
export function TeacherAttendancePage() {
  const { t } = useTranslation();
  return (
    <TeacherCourseHub
      title={t("nav.attendance")}
      description={t("teacher.attendanceHub.description", "Davomatni ko'rish uchun kursni tanlang.")}
      linkFor={(id) => `/teacher/courses/${id}/attendance`}
    />
  );
}
