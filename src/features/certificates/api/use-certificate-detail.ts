// Bitta sertifikat tafsilotlarini yuklash uchun React Query hooki (Req 14.2).
//
// Backend to'liq `Certificate` obyektini qaytaradi, shu jumladan PDF URL,
// QR kod URL, tasdiqlash URL va elektron imzo holati.

import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { apiClient } from '@/shared/api/client'
import { endpoints } from '@/shared/api/endpoints'
import type { Certificate } from '@/shared/types'

/** React Query kesh kaliti — bitta sertifikat tafsiloti. */
export function certificateDetailQueryKey(certificateId: string) {
  return ['certificates', 'detail', certificateId] as const
}

async function fetchCertificateDetail(certificateId: string): Promise<Certificate> {
  const res = await apiClient.get<Certificate>(
    endpoints.certificates.detail(certificateId)
  )
  return res.data
}

/**
 * Bitta sertifikat tafsilotlarini yuklaydi (Req 14.2).
 */
export function useCertificateDetail(
  certificateId: string
): UseQueryResult<Certificate> {
  return useQuery({
    queryKey: certificateDetailQueryKey(certificateId),
    queryFn: () => fetchCertificateDetail(certificateId),
    enabled: !!certificateId,
  })
}