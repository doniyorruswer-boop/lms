// Talabaning sertifikatlar ro'yxatini yuklash uchun React Query hooki (Req 14.1).
//
// Backend `Certificate[]` ro'yxatini qaytaradi. Sertifikatlar kurs nomi,
// berilgan sana va sertifikat raqami bilan ko'rsatiladi.

import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { apiClient } from '@/shared/api/client'
import { endpoints } from '@/shared/api/endpoints'
import type { Certificate } from '@/shared/types'

/** React Query kesh kaliti — foydalanuvchining sertifikatlari ro'yxati. */
export function certificatesQueryKey() {
  return ['certificates', 'list'] as const
}

async function fetchCertificates(): Promise<Certificate[]> {
  const res = await apiClient.get<Certificate[]>(endpoints.certificates.list)
  return res.data
}

/**
 * Talabaning sertifikatlar ro'yxatini yuklaydi (Req 14.1).
 */
export function useCertificates(): UseQueryResult<Certificate[]> {
  return useQuery({
    queryKey: certificatesQueryKey(),
    queryFn: fetchCertificates,
  })
}