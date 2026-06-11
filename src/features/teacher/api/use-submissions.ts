// Baholash bo'yicha talaba ishlarini yuklovchi React Query 5 hooki (Req 10.5).
//
// O'qituvchi baholash (assessment) tafsilotini ochganda shu baholashga
// topshirilgan talaba ishlari ro'yxati yuklanadi. Har bir ish ko'rish, ball
// berish va izoh yozish uchun ishlatiladi.

import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { apiClient } from '@/shared/api/client'
import { endpoints } from '@/shared/api/endpoints'

import type { Submission } from './types'

/** React Query kesh kaliti — baholash bo'yicha ishlar. */
export function submissionsQueryKey(assessmentId: string) {
  return ['teacher', 'submissions', assessmentId] as const
}

/** Baholash bo'yicha talaba ishlarini backend-dan yuklaydi. */
async function fetchSubmissions(assessmentId: string): Promise<Submission[]> {
  const res = await apiClient.get<Submission[]>(
    endpoints.assessments.submissions(assessmentId),
  )
  return res.data
}

/**
 * Baholash bo'yicha talaba ishlarini yuklaydigan React Query hooki (Req 10.5).
 *
 * @param assessmentId Baholash identifikatori.
 */
export function useSubmissions(
  assessmentId: string,
): UseQueryResult<Submission[]> {
  return useQuery({
    queryKey: submissionsQueryKey(assessmentId),
    queryFn: () => fetchSubmissions(assessmentId),
    enabled: assessmentId !== '',
  })
}
