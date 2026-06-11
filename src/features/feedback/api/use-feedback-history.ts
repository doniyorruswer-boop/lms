// Talaba shikoyatlar tarixini yuklovchi React Query hook (Req 15.3).
//
// `GET /complaints` orqali talabaning barcha shikoyat yozuvlarini
// (sana, mavzu, holat, javob) oladi. `isLoading` skeleton/loading uchun,
// `isError` + `refetch` esa xato holati va "Qayta urinish" tugmasi uchun
// ishlatiladi.

import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { apiClient } from '@/shared/api/client'
import { endpoints } from '@/shared/api/endpoints'
import type { Complaint, Paginated } from '@/shared/types'

/** React Query kesh kaliti — talaba shikoyatlar tarixi. */
export const FEEDBACK_HISTORY_QUERY_KEY = ['feedback', 'history'] as const

/** Shikoyatlar ro'yxati uchun parametrlar. */
export interface FeedbackHistoryParams {
  page?: number
  pageSize?: number
}

/** Talabaning shikoyatlar tarixi yozuvlarini backenddan oladi. */
async function fetchFeedbackHistory(
  params?: FeedbackHistoryParams
): Promise<Paginated<Complaint>> {
  const searchParams = new URLSearchParams()
  
  if (params?.page) {
    searchParams.append('page', params.page.toString())
  }
  if (params?.pageSize) {
    searchParams.append('pageSize', params.pageSize.toString())
  }

  const url = params 
    ? `${endpoints.feedback.history}?${searchParams.toString()}`
    : endpoints.feedback.history

  const res = await apiClient.get<Paginated<Complaint>>(url)
  return res.data
}

/**
 * Talaba shikoyatlar tarixini yuklaydigan React Query hooki (Req 15.3).
 */
export function useFeedbackHistory(
  params?: FeedbackHistoryParams
): UseQueryResult<Paginated<Complaint>> {
  return useQuery({
    queryKey: [...FEEDBACK_HISTORY_QUERY_KEY, params],
    queryFn: () => fetchFeedbackHistory(params),
  })
}

/**
 * Bitta shikoyat tafsilotini oluvchi hook.
 */
export function useFeedbackDetail(
  complaintId: string
): UseQueryResult<Complaint> {
  return useQuery({
    queryKey: ['feedback', 'detail', complaintId],
    queryFn: async () => {
      const res = await apiClient.get<Complaint>(
        endpoints.feedback.detail(complaintId)
      )
      return res.data
    },
    enabled: !!complaintId,
  })
}