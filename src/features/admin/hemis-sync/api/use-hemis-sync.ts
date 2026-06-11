// HEMIS_Sync_UI uchun React Query 5 ma'lumot qatlami (Req 12.1–12.6).
//
// Bu modul HEMIS sinxronizatsiya UI ning butun server holatini boshqaradi:
//   - `useStartSync`     — sinxronizatsiyani ishga tushiruvchi mutation (Req 12.1, 12.2).
//   - `useSyncJob`       — faol jobni har 5 soniyada polling qiluvchi query (Req 12.3).
//   - `useSyncHistory`   — sinxronizatsiya tarixi jadvali uchun query (Req 12.5).
//   - `useDownloadErrorLog` — xato loglarini yuklab olish mutationi (Req 12.6).
//
// Polling tabiati: faqat job FAOL (started/running) bo'lganda takrorlanadi;
// job yakunlanishi (completed) yoki xato (error) holatiga o'tishi bilan
// interval o'chiriladi, shunday qilib UI ortiqcha so'rov yubormaydi.

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'

import { apiClient } from '@/shared/api/client'
import { endpoints } from '@/shared/api/endpoints'
import type { Paginated, SyncJob, SyncStatus, SyncType } from '@/shared/types'

/** Faol jobni qayta so'rash oralig'i (ms) — Req 12.3 ("har 5 soniyada"). */
export const SYNC_POLL_INTERVAL_MS = 5_000

/** React Query kesh kaliti — sinxronizatsiya tarixi. */
export const SYNC_HISTORY_QUERY_KEY = ['hemis-sync', 'history'] as const

/** Berilgan job uchun kesh kaliti. */
export const syncJobQueryKey = (jobId: string) =>
  ['hemis-sync', 'job', jobId] as const

/**
 * Job hali ishlayotganini (polling davom etishi kerakligini) bildiradi.
 * `started` va `running` — faol holatlar; `completed`/`error` — terminal.
 */
export function isActiveSyncStatus(status: SyncStatus): boolean {
  return status === 'started' || status === 'running'
}

async function fetchSyncHistory(): Promise<SyncJob[]> {
  const res = await apiClient.get<Paginated<SyncJob>>(endpoints.sync.history)
  return res.data.items
}

/**
 * Sinxronizatsiya tarixini yuklaydigan query (Req 12.5). Jadval sana, tur,
 * holat va yakuniy hisobot ustunlarini shu ma'lumotdan render qiladi.
 */
export function useSyncHistory(): UseQueryResult<SyncJob[]> {
  return useQuery({
    queryKey: SYNC_HISTORY_QUERY_KEY,
    queryFn: fetchSyncHistory,
  })
}

async function startSync(type: SyncType): Promise<SyncJob> {
  const res = await apiClient.post<SyncJob>(endpoints.sync.start(type))
  return res.data
}

/**
 * Tanlangan tur (talaba/o'qituvchi/kurs) bo'yicha sinxronizatsiyani ishga
 * tushiradi (Req 12.1, 12.2). Muvaffaqiyatda qaytgan jobni darhol keshga
 * yozadi, shunda polling query birinchi so'rovsiz ham holatni ko'rsata oladi.
 */
export function useStartSync(): UseMutationResult<SyncJob, unknown, SyncType> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: startSync,
    onSuccess: (job) => {
      queryClient.setQueryData(syncJobQueryKey(job.id), job)
    },
  })
}

async function fetchSyncJob(jobId: string): Promise<SyncJob> {
  const res = await apiClient.get<SyncJob>(endpoints.sync.status(jobId))
  return res.data
}

/**
 * Faol jobning holatini har 5 soniyada poll qiladi (Req 12.3). `jobId` null
 * bo'lsa query o'chirilgan bo'ladi. Job terminal holatga (completed/error)
 * o'tishi bilan `refetchInterval` `false` qaytaradi va polling to'xtaydi.
 */
export function useSyncJob(jobId: string | null): UseQueryResult<SyncJob> {
  return useQuery({
    queryKey: syncJobQueryKey(jobId ?? '__none__'),
    queryFn: () => fetchSyncJob(jobId as string),
    enabled: jobId != null,
    refetchInterval: (query) => {
      const job = query.state.data
      if (!job) {
        return SYNC_POLL_INTERVAL_MS
      }
      return isActiveSyncStatus(job.status) ? SYNC_POLL_INTERVAL_MS : false
    },
  })
}

async function downloadErrorLog(jobId: string): Promise<Blob> {
  const res = await apiClient.get<Blob>(endpoints.sync.errorLog(jobId), {
    responseType: 'blob',
  })
  return res.data
}

/**
 * Brauzerda blob ni fayl sifatida saqlashni boshlaydi. `document`/`URL`
 * mavjud bo'lmagan muhitlarda (mas. SSR) hech narsa qilmaydi.
 */
export function triggerBlobDownload(blob: Blob, fileName: string): void {
  if (typeof document === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return
  }
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

/**
 * Berilgan job uchun xato loglarini yuklab olib, brauzerda saqlashni
 * boshlaydigan mutation (Req 12.6).
 */
export function useDownloadErrorLog(): UseMutationResult<Blob, unknown, string> {
  return useMutation({
    mutationFn: downloadErrorLog,
    onSuccess: (blob, jobId) => {
      triggerBlobDownload(blob, `hemis-sync-${jobId}-errors.log`)
    },
  })
}
