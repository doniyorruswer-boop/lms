// Monitoring_Panel ma'lumotlarini React Query 5 orqali yuklovchi hook
// (Req 13.1–13.5).
//
// Bitta `useQuery` ikkita manbani parallel yuklaydi: OTM bo'yicha
// o'qituvchi-talaba nisbati statistikasi (`monitoring.otmStats`) va
// ta'lim yo'nalishi/OTM bo'yicha kontingent statistikasi
// (`monitoring.contingent`). Shu tarzda skeleton/loading, xato va "Qayta
// urinish" holatlari butun panel uchun yagona joyda boshqariladi.
//
// Sana oralig'i (`MonitoringDateRange`) kesh kalitiga kiritiladi — filtr
// o'zgarganda React Query avtomatik qayta yuklaydi (Req 13.5).

import { keepPreviousData, useQuery, type UseQueryResult } from '@tanstack/react-query'

import { apiClient } from '@/shared/api/client'
import { endpoints } from '@/shared/api/endpoints'
import type { ContingentStat, OtmStats } from '@/shared/types'

/** Sana oralig'i filtri (ISO `YYYY-MM-DD`; bo'sh satr → cheklanmagan). */
export interface MonitoringDateRange {
  from: string
  to: string
}

export type DateRange = MonitoringDateRange

/** Bo'sh (cheklanmagan) standart sana oralig'i. */
export const EMPTY_DATE_RANGE: MonitoringDateRange = { from: '', to: '' }

/** Monitoring panelining birlashtirilgan ko'rinish modeli. */
export interface MonitoringData {
  /** OTM bo'yicha nisbat statistikasi (Req 13.2). */
  otmStats: OtmStats[]
  /** Ta'lim yo'nalishi/OTM bo'yicha kontingent (Req 13.4). */
  contingent: ContingentStat[]
}

/** React Query kesh kaliti — sana oralig'iga bog'langan monitoring ma'lumoti. */
export function monitoringQueryKey(range: MonitoringDateRange) {
  return ['monitoring', 'data', { from: range.from, to: range.to }] as const
}

/**
 * Faqat to'ldirilgan (bo'sh bo'lmagan) sana chegaralarini so'rov parametriga
 * aylantiradi.
 */
function rangeParams(range: MonitoringDateRange): Record<string, string> {
  const params: Record<string, string> = {}
  if (range.from) params.from = range.from
  if (range.to) params.to = range.to
  return params
}

/**
 * Monitoring panelining ikkita manbasini parallel yuklab, birlashtirilgan
 * ko'rinish modeliga aylantiradi.
 */
async function fetchMonitoringData(
  range: MonitoringDateRange,
): Promise<MonitoringData> {
  const params = rangeParams(range)
  const [otmRes, contingentRes] = await Promise.all([
    apiClient.get<OtmStats[]>(endpoints.monitoring.otmStats, { params }),
    apiClient.get<ContingentStat[]>(endpoints.monitoring.contingent, {
      params,
    }),
  ])

  return {
    otmStats: otmRes.data,
    contingent: contingentRes.data,
  }
}

/**
 * Monitoring panel ma'lumotlarini yuklaydigan React Query hooki.
 *
 * Sana oralig'i o'zgarganda kesh kaliti o'zgaradi va ma'lumot qayta yuklanadi
 * (Req 13.5). `placeholderData: keepPreviousData` filtr o'tishlarida oldingi
 * diagrammalarni saqlab turadi — shunday qilib UI "miltillamaydi".
 *
 * @param range Sana oralig'i filtri.
 */
export function useMonitoringData(
  range: MonitoringDateRange = EMPTY_DATE_RANGE,
): UseQueryResult<MonitoringData> {
  return useQuery({
    queryKey: monitoringQueryKey(range),
    queryFn: () => fetchMonitoringData(range),
    placeholderData: keepPreviousData,
  })
}
