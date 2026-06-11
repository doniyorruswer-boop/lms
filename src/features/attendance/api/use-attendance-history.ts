// Talaba davomat tarixini yuklovchi React Query hook (Req 9.4).
//
// `GET /attendance/history` orqali talabaning barcha davomat yozuvlarini
// (sana, kurs nomi, kirish/chiqish vaqtlari) oladi. `isLoading` skeleton/
// loading uchun, `isError` + `refetch` esa xato holati va "Qayta urinish"
// tugmasi uchun ishlatiladi.

import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { apiClient } from '@/shared/api/client'
import { endpoints } from '@/shared/api/endpoints'
import type { AttendanceRecord } from '@/shared/types'

/** React Query kesh kaliti — talaba davomat tarixi. */
export const ATTENDANCE_HISTORY_QUERY_KEY = ['attendance', 'history'] as const

/** Talabaning davomat tarixi yozuvlarini backenddan oladi. */
async function fetchAttendanceHistory(): Promise<AttendanceRecord[]> {
  const res = await apiClient.get<AttendanceRecord[]>(
    endpoints.attendance.history,
  )
  return res.data
}

/**
 * Talaba davomat tarixini yuklaydigan React Query hooki (Req 9.4).
 */
export function useAttendanceHistory(): UseQueryResult<AttendanceRecord[]> {
  return useQuery({
    queryKey: ATTENDANCE_HISTORY_QUERY_KEY,
    queryFn: fetchAttendanceHistory,
  })
}
