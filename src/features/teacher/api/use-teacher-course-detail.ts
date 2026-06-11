// O'qituvchi kurs tafsiloti uchun ma'lumotlarni yuklovchi React Query 5 hooki
// (Req 10.2).
//
// Kurs tafsiloti to'rtta manbani birlashtiradi: darslar, materiallar,
// baholashlar va talabalar ro'yxati. Tegishli endpointlar
// (`lessons.listByCourse`, `assessments.list`, `courses.students`) parallel
// chaqiriladi va bitta `useQuery` ostida birlashtiriladi — yuklanish, xato va
// "Qayta urinish" holatlari butun sahifa uchun yagona joyda boshqariladi.
// Materiallar darslarning `materials` maydonlaridan to'planadi.

import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { apiClient } from '@/shared/api/client'
import { endpoints } from '@/shared/api/endpoints'
import type {
  Assessment,
  Lesson,
  Material,
  Paginated,
} from '@/shared/types'

/** Kurs tafsilotidagi talabalar ro'yxati uchun yengil model. */
export interface CourseStudent {
  id: string
  fullName: string
  enrolledAt: string | null
}

/** O'qituvchi kurs tafsiloti uchun birlashtirilgan ko'rinish modeli. */
export interface TeacherCourseDetailData {
  /** Kurs darslari (Req 10.2). */
  lessons: Lesson[]
  /** Barcha darslardan to'plangan materiallar (Req 10.2). */
  materials: Material[]
  /** Kurs baholashlari (Req 10.2). */
  assessments: Assessment[]
  /** Kursga yozilgan talabalar (Req 10.2). */
  students: CourseStudent[]
}

/** React Query kesh kaliti — o'qituvchi kurs tafsiloti. */
export function teacherCourseDetailQueryKey(courseId: string) {
  return ['teacher', 'course-detail', courseId] as const
}

/**
 * Kurs tafsiloti uchun zarur manbalarni parallel yuklab, birlashtirilgan
 * ko'rinish modeliga aylantiradi.
 */
async function fetchTeacherCourseDetail(
  courseId: string,
): Promise<TeacherCourseDetailData> {
  const [lessonsRes, assessmentsRes, studentsRes] = await Promise.all([
    apiClient.get<Lesson[]>(endpoints.lessons.listByCourse(courseId)),
    apiClient.get<Paginated<Assessment>>(endpoints.assessments.list, {
      params: { courseId },
    }),
    apiClient.get<CourseStudent[]>(endpoints.courses.students(courseId)),
  ])

  const lessons = lessonsRes.data
  const materials = lessons.flatMap((lesson) => lesson.materials)

  return {
    lessons,
    materials,
    assessments: assessmentsRes.data.items,
    students: studentsRes.data,
  }
}

/**
 * O'qituvchi kurs tafsiloti ma'lumotlarini yuklaydigan React Query hooki
 * (Req 10.2).
 *
 * @param courseId Kurs identifikatori.
 */
export function useTeacherCourseDetail(
  courseId: string,
): UseQueryResult<TeacherCourseDetailData> {
  return useQuery({
    queryKey: teacherCourseDetailQueryKey(courseId),
    queryFn: () => fetchTeacherCourseDetail(courseId),
    enabled: courseId !== '',
  })
}
