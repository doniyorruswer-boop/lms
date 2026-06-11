// Complaints API hooks (Req 15.1, 15.2, 15.3)
//
// Bu modul shikoyatlar bilan ishlash uchun React Query hookalarini taqdim etadi:
// - Shikoyat yaratish (create)
// - Shikoyatlar tarixini olish (list/history)
// - Alohida shikoyat tafsilotini olish (detail)

import { useMutation, useQuery, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query'

import { apiClient } from '@/shared/api/client'
import { endpoints } from '@/shared/api/endpoints'
import type { Complaint, Paginated } from '@/shared/types'

/** Shikoyat yaratish uchun input ma'lumotlari */
export interface CreateComplaintRequest {
  category: string
  courseId?: string | null
  text: string
  attachments?: File[]
}

/** Shikoyat yaratish javobida qaytariladigan ma'lumotlar */
export interface CreateComplaintResponse {
  id: string
  number: string
  message: string
}

/** Shikoyatlar ro'yxati parametrlari */
export interface ComplaintsListParams {
  page?: number
  pageSize?: number
}

/** React Query kesh kalitlari */
export const COMPLAINTS_QUERY_KEYS = {
  all: ['complaints'] as const,
  list: (params?: ComplaintsListParams) => [...COMPLAINTS_QUERY_KEYS.all, 'list', params] as const,
  detail: (id: string) => [...COMPLAINTS_QUERY_KEYS.all, 'detail', id] as const,
} as const

/**
 * Shikoyat yaratish funksiyasi
 */
async function createComplaint(request: CreateComplaintRequest): Promise<CreateComplaintResponse> {
  const formData = new FormData()
  formData.append('category', request.category)
  if (request.courseId) {
    formData.append('courseId', request.courseId)
  }
  formData.append('text', request.text)
  
  // Fayl biriktirmalari (agar mavjud bo'lsa)
  if (request.attachments && request.attachments.length > 0) {
    request.attachments.forEach((file) => {
      formData.append('attachments', file)
    })
  }

  const response = await apiClient.post<CreateComplaintResponse>(
    endpoints.complaints.create,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  )

  return response.data
}

/**
 * Shikoyatlar ro'yxatini olish funksiyasi
 */
async function fetchComplaints(params?: ComplaintsListParams): Promise<Paginated<Complaint>> {
  const response = await apiClient.get<Paginated<Complaint>>(
    endpoints.complaints.list,
    {
      params: {
        page: params?.page || 1,
        pageSize: params?.pageSize || 10,
      },
    }
  )

  return response.data
}

/**
 * Alohida shikoyat tafsilotini olish funksiyasi
 */
async function fetchComplaintDetail(id: string): Promise<Complaint> {
  const response = await apiClient.get<Complaint>(endpoints.complaints.detail(id))
  return response.data
}

/**
 * Shikoyat yaratish uchun mutation hook (Req 15.1, 15.2)
 */
export function useCreateComplaint(): UseMutationResult<
  CreateComplaintResponse,
  Error,
  CreateComplaintRequest
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createComplaint,
    onSuccess: () => {
      // Shikoyat yaratilgandan so'ng ro'yxatni qayta yuklash
      queryClient.invalidateQueries({
        queryKey: COMPLAINTS_QUERY_KEYS.all,
      })
    },
  })
}

/**
 * Shikoyatlar tarixini olish uchun query hook (Req 15.3)
 */
export function useComplaints(params?: ComplaintsListParams): UseQueryResult<Paginated<Complaint>> {
  return useQuery({
    queryKey: COMPLAINTS_QUERY_KEYS.list(params),
    queryFn: () => fetchComplaints(params),
  })
}

/**
 * Alohida shikoyat tafsilotini olish uchun query hook
 */
export function useComplaintDetail(id: string): UseQueryResult<Complaint> {
  return useQuery({
    queryKey: COMPLAINTS_QUERY_KEYS.detail(id),
    queryFn: () => fetchComplaintDetail(id),
    enabled: !!id,
  })
}