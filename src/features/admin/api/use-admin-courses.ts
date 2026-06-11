// Admin kurslar ro'yxatini React Query 5 orqali yuklovchi hook (Req 11.2).
//
// Ro'yxat backend-dan sahifalash (pagination) bilan yuklanadi. Ta'lim
// yo'nalishi, semestr va o'qituvchi bo'yicha filtrlar mijoz tomonida joriy
// sahifa ustida `filterCourses` toza funksiyasi orqali qo'llanadi
// (komponentda). Sahifalar orasida oldingi ma'lumot saqlanadi
// (`keepPreviousData`).

import {
  keepPreviousData,
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query'

import { apiClient } from '@/shared/api/client'
import { endpoints } from '@/shared/api/endpoints'
import type { Course, Paginated } from '@/shared/types'

/** Sahifalash uchun sahifa o'lchami. */
export const ADMIN_COURSES_PAGE_SIZE = 20

/** React Query kesh kaliti — sahifalangan kurslar ro'yxati. */
export function adminCoursesQueryKey(page: number, pageSize: number) {
  return ['admin', 'courses', { page, pageSize }] as const
}

async function fetchAdminCourses(
  page: number,
  pageSize: number,
): Promise<Paginated<Course>> {
  const res = await apiClient.get<Paginated<Course>>(endpoints.courses.list, {
    params: { page, pageSize },
  })
  return res.data
}

/**
 * Sahifalangan admin kurslar ro'yxatini yuklaydigan hook (Req 11.2).
 */
export function useAdminCourses(
  page: number = 1,
  pageSize: number = ADMIN_COURSES_PAGE_SIZE,
): UseQueryResult<Paginated<Course>> {
  return useQuery({
    queryKey: adminCoursesQueryKey(page, pageSize),
    queryFn: () => fetchAdminCourses(page, pageSize),
    placeholderData: keepPreviousData,
  })
}
