// O'qituvchi paneli uchun kurs bo'yicha davomatni yuklovchi React Query hook
// (Req 9.5).
//
// `GET /attendance/courses/:courseId` orqali kursning har bir darsi uchun
// darsga kirgan talabalar ro'yxatini va ularning kirish/chiqish vaqtlarini
// oladi. Natija dars bo'yicha guruhlangan (`LessonAttendance[]`).

import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { apiClient } from '@/shared/api/client'
import { endpoints } from '@/shared/api/endpoints'

/** Bitta talabaning bitta darsdagi davomat yozuvi (o'qituvchi ko'rinishi). */
export interface CourseAttendanceStudent {
  studentId: string
  studentName: string
  /** Kirish vaqti, ISO 8601 yoki `null` (kirmagan). */
  checkInAt: string | null
  /** Chiqish vaqti, ISO 8601 yoki `null` (chiqmagan). */
  checkOutAt: string | null
}

/** Bitta dars uchun darsga kirgan talabalar ro'yxati (Req 9.5). */
export interface LessonAttendance {
  lessonId: string
  lessonTitle: string
  /** Dars sanasi, ISO 8601. */
  date: string
  /** Shu darsga kirgan talabalar va ularning vaqtlari. */
  students: CourseAttendanceStudent[]
}

/** React Query kesh kaliti — kurs bo'yicha davomat. */
export function courseAttendanceQueryKey(courseId: string) {
  return ['attendance', 'course', courseId] as const
}

/** Kurs bo'yicha dars-darsga davomat ma'lumotini backenddan oladi. */
async function fetchCourseAttendance(
  courseId: string,
): Promise<LessonAttendance[]> {
  const res = await apiClient.get<LessonAttendance[]>(
    endpoints.attendance.byCourse(courseId),
  )
  return res.data
}

/**
 * O'qituvchi paneli uchun kurs bo'yicha dars-darsga davomatni yuklaydigan
 * React Query hooki (Req 9.5).
 *
 * @param courseId Kurs identifikatori. Bo'sh bo'lsa so'rov o'chiriladi.
 */
export function useCourseAttendance(
  courseId: string,
): UseQueryResult<LessonAttendance[]> {
  return useQuery({
    queryKey: courseAttendanceQueryKey(courseId),
    queryFn: () => fetchCourseAttendance(courseId),
    enabled: courseId.length > 0,
  })
}
