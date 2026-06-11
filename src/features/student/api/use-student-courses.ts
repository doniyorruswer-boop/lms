// Talabaning kurslar ro'yxatini sahifalash (pagination) bilan yuklovchi
// React Query 5 hooki (Req 3.2).
//
// Backend kurslarni `Paginated<Course>` ko'rinishida qaytaradi. Sahifa raqami
// (`page`) va sahifa o'lchami (`pageSize`) so'rov parametrlari sifatida
// yuboriladi. Qidiruv (`searchCourses`) toza logika orqali komponent
// tomonida bajariladi — bu kesh kalitiga ta'sir qilmaydi va backend trafigini
// oshirmaydi.

import {
  keepPreviousData,
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query'

import { apiClient } from '@/shared/api/client'
import { endpoints } from '@/shared/api/endpoints'
import type { Course, Paginated } from '@/shared/types'

/** Kurslar ro'yxati uchun standart sahifa o'lchami. */
export const STUDENT_COURSES_PAGE_SIZE = 10

/** React Query kesh kaliti — sahifaga bog'langan kurslar ro'yxati. */
export function studentCoursesQueryKey(page: number, pageSize: number) {
  return ['student', 'courses', { page, pageSize }] as const
}

/**
 * Berilgan sahifa uchun kurslarni backend-dan yuklaydi.
 */
async function fetchStudentCourses(
  page: number,
  pageSize: number,
): Promise<Paginated<Course>> {
  const res = await apiClient.get<Paginated<Course>>(endpoints.courses.list, {
    params: { page, pageSize },
  })
  return res.data
}

/**
 * Talabaning kurslar ro'yxatini sahifalash bilan yuklaydigan hook (Req 3.2).
 *
 * `placeholderData: keepPreviousData` sahifalar orasida o'tishda oldingi
 * ma'lumotni saqlab turadi — shunday qilib pagination silliq bo'ladi va
 * har o'tishda skeleton "miltillamaydi".
 *
 * @param page Joriy sahifa raqami (1 dan boshlanadi).
 * @param pageSize Sahifadagi kurslar soni.
 */
export function useStudentCourses(
  page: number,
  pageSize: number = STUDENT_COURSES_PAGE_SIZE,
): UseQueryResult<Paginated<Course>> {
  return useQuery({
    queryKey: studentCoursesQueryKey(page, pageSize),
    queryFn: () => fetchStudentCourses(page, pageSize),
    placeholderData: keepPreviousData,
  })
}
