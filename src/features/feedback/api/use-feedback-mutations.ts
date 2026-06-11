// Shikoyat (feedback) yuborish mutatsiyasi (Req 15.1, 15.2).
//
// Talaba shikoyat formasini to'ldirgandan so'ng submit qilganda, form ma'lumotlari
// multipart/form-data sifatida backendga yuboriladi (matn + ilovalar). React Query 5
// `useMutation` orqali yuborish holati (`isPending`), xato (`isError`) va muvaffaqiyat
// boshqariladi. Muvaffaqiyatli yuborilganda shikoyat raqami qaytariladi.

import { useMutation, type UseMutationResult } from '@tanstack/react-query'

import { apiClient } from '@/shared/api/client'
import { endpoints } from '@/shared/api/endpoints'
import type { Complaint } from '@/shared/types'
import type { FeedbackFormValues } from '@/shared/lib/validation'

/** Shikoyat yaratish uchun so'rov yuki. */
export interface CreateFeedbackPayload {
  category: string
  courseId?: string
  text: string
  attachments?: File[]
}

/** Shikoyat yaratish javobida qaytadigan ma'lumot. */
export interface CreateFeedbackResponse {
  complaint: Complaint
  message: string
}

/**
 * Shikoyatni backendga yuboradi (Req 15.2).
 * Forma ma'lumotlari multipart/form-data sifatida yuboriladi.
 */
async function postFeedback(
  payload: CreateFeedbackPayload,
): Promise<CreateFeedbackResponse> {
  const formData = new FormData()
  
  formData.append('category', payload.category)
  formData.append('text', payload.text)
  
  if (payload.courseId) {
    formData.append('courseId', payload.courseId)
  }
  
  if (payload.attachments) {
    payload.attachments.forEach((file, index) => {
      formData.append(`attachments`, file)
    })
  }

  const res = await apiClient.post<CreateFeedbackResponse>(
    endpoints.feedback.create,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  )
  return res.data
}

/**
 * Shikoyat yaratish uchun mutatsiya hooki (Req 15.1, 15.2).
 * Muvaffaqiyatli yuborilganda shikoyat raqami qaytariladi.
 */
export function useCreateFeedback(): UseMutationResult<
  CreateFeedbackResponse,
  Error,
  CreateFeedbackPayload
> {
  return useMutation({ 
    mutationFn: postFeedback,
    onSuccess: (data) => {
      // Muvaffaqiyat xabari console.log orqali, UI da toast ko'rsatiladi
      console.log('Shikoyat muvaffaqiyatli yuborildi:', data.complaint.number)
    },
  })
}

/**
 * React Hook Form uchun helper funksiya - FeedbackFormValues ni 
 * CreateFeedbackPayload ga o'tkazadi.
 */
export function convertFormDataToPayload(
  formData: FeedbackFormValues
): CreateFeedbackPayload {
  return {
    category: formData.category,
    courseId: formData.courseId,
    text: formData.text,
    attachments: formData.attachments,
  }
}