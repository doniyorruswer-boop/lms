// Kurs tafsiloti sahifasi uchun ma'lumotlarni yuklovchi React Query 5 hooki
// (Req 3.3).
//
// Kurs tafsiloti to'rtta manbani birlashtiradi: darslar, materiallar,
// baholashlar va davomat. Maxsus yagona endpoint mavjud emas, shu sababli
// tegishli endpointlar (`lessons.listByCourse`, `assessments.list`,
// `attendance.byCourse`) parallel chaqiriladi va bitta `useQuery` ostida
// birlashtiriladi — yuklanish, xato va "Qayta urinish" holatlari butun sahifa
// uchun yagona joyda boshqariladi (Req 3.4, 3.5). Materiallar darslarning
// `materials` maydonlaridan to'planadi.

import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { apiClient } from '@/shared/api/client'
import { endpoints } from '@/shared/api/endpoints'
import type {
  Assessment,
  AttendanceRecord,
  Lesson,
  Material,
  Paginated,
} from '@/shared/types'

/** Kurs tafsiloti uchun birlashtirilgan ko'rinish modeli. */
export interface CourseDetailData {
  /** Kurs darslari (Req 3.3). */
  lessons: Lesson[]
  /** Barcha darslardan to'plangan materiallar (Req 3.3). */
  materials: Material[]
  /** Kurs baholashlari (Req 3.3). */
  assessments: Assessment[]
  /** Kurs bo'yicha davomat yozuvlari (Req 3.3). */
  attendance: AttendanceRecord[]
}

/** React Query kesh kaliti — kurs tafsiloti. */
export function courseDetailQueryKey(courseId: string) {
  return ['student', 'course-detail', courseId] as const
}

/**
 * Kurs tafsiloti uchun zarur manbalarni parallel yuklab, birlashtirilgan
 * ko'rinish modeliga aylantiradi.
 */
async function fetchCourseDetail(courseId: string): Promise<CourseDetailData> {
  const [lessonsRes, assessmentsRes, attendanceRes] = await Promise.all([
    apiClient.get<Lesson[]>(endpoints.lessons.listByCourse(courseId)),
    apiClient.get<Paginated<Assessment>>(endpoints.assessments.list, {
      params: { courseId },
    }),
    apiClient.get<AttendanceRecord[]>(endpoints.attendance.byCourse(courseId)),
  ])

  const lessons = lessonsRes.data
  const materials = lessons.flatMap((lesson) => lesson.materials)

  return {
    lessons,
    materials,
    assessments: assessmentsRes.data.items,
    attendance: attendanceRes.data,
  }
}

/**
 * Kurs tafsiloti ma'lumotlarini yuklaydigan React Query hooki (Req 3.3).
 *
 * `isLoading` skeleton loader uchun, `isError` + `refetch` esa xato holati va
 * "Qayta urinish" tugmasi uchun ishlatiladi (Req 3.4, 3.5).
 *
 * @param courseId Kurs identifikatori.
 */
export function useCourseDetail(
  courseId: string,
): UseQueryResult<CourseDetailData> {
  return useQuery({
    queryKey: courseDetailQueryKey(courseId),
    queryFn: () => fetchCourseDetail(courseId),
    enabled: courseId !== '',
  })
}
