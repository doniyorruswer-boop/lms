// HEMIS_Sync_UI sahifasi — boshqaruv, polling, hisobot, tarix va xato loglari
// (Req 12.1–12.6).
//
// React Query hooklarini bog'laydi:
//   - `useStartSync`  — tugma bosilganda sinxronlashni boshlaydi (12.1, 12.2).
//   - `useSyncJob`    — faol jobni har 5s poll qiladi (12.3).
//   - `useSyncHistory`— tarix jadvali (12.5); job tugaganda yangilanadi.
//   - `useDownloadErrorLog` — xato loglarini yuklab olish (12.6).

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { AlertCircle } from 'lucide-react'

import type { SyncStatus, SyncType } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'

import {
  SYNC_HISTORY_QUERY_KEY,
  isActiveSyncStatus,
  useDownloadErrorLog,
  useStartSync,
  useSyncHistory,
  useSyncJob,
} from '../api/use-hemis-sync'
import { SyncControls } from './sync-controls'
import { SyncFinalReport } from './sync-final-report'
import { SyncHistoryTable } from './sync-history-table'

/** Job terminal (yakuniy) holatda ekanini bildiradi. */
function isTerminalStatus(status: SyncStatus): boolean {
  return status === 'completed' || status === 'error'
}

/**
 * HEMIS sinxronizatsiya boshqaruv sahifasi. 26.1 (boshqaruv + polling) va
 * 26.2 (hisobot + tarix + xato loglari) ni birlashtiradi.
 */
export function HemisSyncPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [pendingType, setPendingType] = useState<SyncType | null>(null)

  const startSync = useStartSync()
  const jobQuery = useSyncJob(activeJobId)
  const historyQuery = useSyncHistory()
  const downloadLog = useDownloadErrorLog()

  const activeJob = jobQuery.data ?? null

  // Job terminal holatga o'tganda tarixni bir marta yangilaymiz (Req 12.5),
  // shunda yangi yakunlangan job tarix jadvalida darhol ko'rinadi.
  const refreshedForJob = useRef<string | null>(null)
  useEffect(() => {
    if (!activeJob || !isTerminalStatus(activeJob.status)) {
      return
    }
    if (refreshedForJob.current === activeJob.id) {
      return
    }
    refreshedForJob.current = activeJob.id
    void queryClient.invalidateQueries({ queryKey: SYNC_HISTORY_QUERY_KEY })
  }, [activeJob, queryClient])

  function handleStart(type: SyncType) {
    setPendingType(type)
    startSync.mutate(type, {
      onSuccess: (job) => {
        setActiveJobId(job.id)
      },
      onSettled: () => {
        setPendingType(null)
      },
    })
  }

  function handleDownloadLog(jobId: string) {
    downloadLog.mutate(jobId)
  }

  // Yakuniy hisobot faqat job terminal holatga yetganda ko'rsatiladi (Req 12.4).
  const showFinalReport =
    activeJob != null && isTerminalStatus(activeJob.status)

  const historyJobs = historyQuery.data ?? []

  return (
    <main className="space-y-6 p-6" aria-labelledby="hemis-sync-title">
      <header className="space-y-1">
        <h1 id="hemis-sync-title" className="text-2xl font-bold">
          {t('admin.sync.title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('admin.sync.description')}
        </p>
      </header>

      {startSync.isError ? (
        <Card role="alert" className="border-destructive">
          <CardContent className="flex items-center gap-2 py-4 text-sm text-destructive">
            <AlertCircle className="size-4" aria-hidden="true" />
            {t('admin.sync.startError')}
          </CardContent>
        </Card>
      ) : null}

      <SyncControls
        activeJob={activeJob}
        isStarting={startSync.isPending}
        pendingType={pendingType}
        onStart={handleStart}
      />

      {showFinalReport && activeJob ? (
        <SyncFinalReport
          job={activeJob}
          onDownloadLog={handleDownloadLog}
          isDownloading={
            downloadLog.isPending && downloadLog.variables === activeJob.id
          }
        />
      ) : null}

      {historyQuery.isError ? (
        <Card role="alert" className="border-destructive">
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <span className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="size-4" aria-hidden="true" />
              {t('admin.sync.loadError')}
            </span>
            <Button variant="outline" onClick={() => void historyQuery.refetch()}>
              {t('admin.sync.retry')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <SyncHistoryTable
          jobs={historyJobs}
          onDownloadLog={handleDownloadLog}
          downloadingJobId={
            downloadLog.isPending ? (downloadLog.variables ?? null) : null
          }
        />
      )}
    </main>
  )
}

export default HemisSyncPage

// `isActiveSyncStatus` re-eksporti — sahifa testlari uchun qulaylik.
export { isActiveSyncStatus }
