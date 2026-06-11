// Student dashboard ma'lumotlarini React Query 5 orqali yuklovchi hook (Req 3.1).
//
// Dashboard uchta manbani birlashtiradi: faol kurslar, yaqinlashayotgan
// baholashlar va umumiy davomat foizi. Maxsus dashboard endpointi mavjud
// emas, shu sababli mavjud endpointlar (`courses.list`, `assessments.list`,
// `attendance.history`) parallel ravishda chaqiriladi va bitta `useQuery`
// ostida birlashtiriladi — shunday qilib skeleton/loading, xato va "Qayta
// urinish" (retry) holatlari butun dashboard uchun yagona joyda boshqariladi
// (Req 3.4, 3.5).

import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { apiClient } from '@/shared/api/client'
import { endpoints } from '@/shared/api/endpoints'
import type {
  Assessment,
  AttendanceRecord,
  Course,
  Paginated,
} from '@/shared/types'

import { computeAttendancePercent } from '../lib/attendance-percent'

/** Student dashboard uchun birlashtirilgan ko'rinish modeli. */
export interface StudentDashboardData {
  /** Talabaning faol kurslari (Req 3.1). */
  activeCourses: Course[]
  /** Yaqinlashayotgan baholashlar (Req 3.1). */
  upcomingAssessments: Assessment[]
  /** Umumiy davomat foizi, [0, 100] (Req 3.1). */
  attendancePercent: number
}

/** React Query kesh kaliti — student dashboard. */
export const STUDENT_DASHBOARD_QUERY_KEY = ['student', 'dashboard'] as const

/**
 * Dashboard uchun zarur uchta manbani parallel yuklab, birlashtirilgan
 * ko'rinish modeliga aylantiradi.
 */
async function fetchStudentDashboard(): Promise<StudentDashboardData> {
  const [coursesRes, assessmentsRes, attendanceRes] = await Promise.all([
    apiClient.get<Paginated<Course>>(endpoints.courses.list, {
      params: { active: true },
    }),
    apiClient.get<Paginated<Assessment>>(endpoints.assessments.list, {
      params: { upcoming: true },
    }),
    apiClient.get<AttendanceRecord[]>(endpoints.attendance.history),
  ])

  return {
    activeCourses: coursesRes.data.items,
    upcomingAssessments: assessmentsRes.data.items,
    attendancePercent: computeAttendancePercent(attendanceRes.data),
  }
}

/**
 * Student dashboard ma'lumotlarini yuklaydigan React Query hooki.
 *
 * `isLoading` skeleton loader uchun, `isError` + `refetch` esa xato holati va
 * "Qayta urinish" tugmasi uchun ishlatiladi (Req 3.4, 3.5).
 */
export function useStudentDashboard(): UseQueryResult<StudentDashboardData> {
  return useQuery({
    queryKey: STUDENT_DASHBOARD_QUERY_KEY,
    queryFn: fetchStudentDashboard,
  })
}
