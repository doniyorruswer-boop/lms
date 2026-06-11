// Teacher dashboard ma'lumotlarini React Query 5 orqali yuklovchi hook
// (Req 10.1).
//
// Dashboard uchta manbani birlashtiradi: o'qituvchining faol kurslari, yaqin
// kunlardagi darslari va baholanmagan ishlar soni. Maxsus yagona dashboard
// endpointi mavjud emas, shu sababli tegishli endpointlar (`courses.list`
// o'qituvchi filtri bilan, `lessons.upcoming`, `assessments.ungradedCount`)
// parallel chaqiriladi va bitta `useQuery` ostida birlashtiriladi — shunday
// qilib skeleton/loading, xato va "Qayta urinish" (retry) holatlari butun
// dashboard uchun yagona joyda boshqariladi (Req 10.1).

import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { apiClient } from '@/shared/api/client'
import { endpoints } from '@/shared/api/endpoints'
import type { Course, Lesson, Paginated } from '@/shared/types'

/** Teacher dashboard uchun birlashtirilgan ko'rinish modeli. */
export interface TeacherDashboardData {
  /** O'qituvchining faol kurslari (Req 10.1). */
  activeCourses: Course[]
  /** Yaqin kunlardagi darslar (Req 10.1). */
  upcomingLessons: Lesson[]
  /** Baholanmagan ishlar soni (Req 10.1). */
  ungradedCount: number
}

/** React Query kesh kaliti — teacher dashboard. */
export const TEACHER_DASHBOARD_QUERY_KEY = ['teacher', 'dashboard'] as const

/** Baholanmagan ishlar soni javobi. */
interface UngradedCountResponse {
  count: number
}

/**
 * Dashboard uchun zarur uchta manbani parallel yuklab, birlashtirilgan
 * ko'rinish modeliga aylantiradi.
 */
async function fetchTeacherDashboard(): Promise<TeacherDashboardData> {
  const [coursesRes, lessonsRes, ungradedRes] = await Promise.all([
    apiClient.get<Paginated<Course>>(endpoints.courses.list, {
      params: { teaching: true, active: true },
    }),
    apiClient.get<Lesson[]>(endpoints.lessons.upcoming),
    apiClient.get<UngradedCountResponse>(endpoints.assessments.ungradedCount),
  ])

  return {
    activeCourses: coursesRes.data.items,
    upcomingLessons: lessonsRes.data,
    ungradedCount: ungradedRes.data.count,
  }
}

/**
 * Teacher dashboard ma'lumotlarini yuklaydigan React Query hooki (Req 10.1).
 *
 * `isLoading` skeleton loader uchun, `isError` + `refetch` esa xato holati va
 * "Qayta urinish" tugmasi uchun ishlatiladi.
 */
export function useTeacherDashboard(): UseQueryResult<TeacherDashboardData> {
  return useQuery({
    queryKey: TEACHER_DASHBOARD_QUERY_KEY,
    queryFn: fetchTeacherDashboard,
  })
}
