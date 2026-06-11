// Davomat check-in/check-out mutatsiyalari (Req 9.2, 9.3).
//
// Talaba "Darsga kirdim"/"Darsdan chiqdim" tugmalarini bosganda kirish/chiqish
// vaqti backendga yuboriladi. React Query 5 `useMutation` orqali yuborish
// holati (`isPending`), xato (`isError`) va muvaffaqiyat boshqariladi. Vaqt
// (`at`) ISO 8601 satr sifatida yuboriladi.

import { useMutation, type UseMutationResult } from '@tanstack/react-query'

import { apiClient } from '@/shared/api/client'
import { endpoints } from '@/shared/api/endpoints'
import type { AttendanceRecord } from '@/shared/types'

/** Check-in/check-out so'rovi uchun yuk (payload). */
export interface AttendanceCheckPayload {
  /** Dars identifikatori. */
  lessonId: string
  /** Kirish yoki chiqish vaqti, ISO 8601 satr. */
  at: string
}

/** Kirish vaqtini backendga yuboradi (Req 9.2). */
async function postCheckIn(
  payload: AttendanceCheckPayload,
): Promise<AttendanceRecord> {
  const res = await apiClient.post<AttendanceRecord>(
    endpoints.attendance.checkIn,
    payload,
  )
  return res.data
}

/** Chiqish vaqtini backendga yuboradi (Req 9.3). */
async function postCheckOut(
  payload: AttendanceCheckPayload,
): Promise<AttendanceRecord> {
  const res = await apiClient.post<AttendanceRecord>(
    endpoints.attendance.checkOut,
    payload,
  )
  return res.data
}

/**
 * "Darsga kirdim" tugmasi uchun mutatsiya hooki — kirish vaqtini yuboradi
 * (Req 9.2).
 */
export function useCheckIn(): UseMutationResult<
  AttendanceRecord,
  Error,
  AttendanceCheckPayload
> {
  return useMutation({ mutationFn: postCheckIn })
}

/**
 * "Darsdan chiqdim" tugmasi uchun mutatsiya hooki — chiqish vaqtini yuboradi
 * (Req 9.3).
 */
export function useCheckOut(): UseMutationResult<
  AttendanceRecord,
  Error,
  AttendanceCheckPayload
> {
  return useMutation({ mutationFn: postCheckOut })
}
