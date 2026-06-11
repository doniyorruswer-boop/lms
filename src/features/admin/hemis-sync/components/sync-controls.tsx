// Sinxronlash boshqaruvi: tugmalar, holat ko'rsatkichi va progress bar (Req 12.1–12.3).
//
// Bu komponent prezentatsion (presentational) — barcha ma'lumot va kolbeklar
// props orqali beriladi, shunday qilib u oson testlanadi. Polling va mutation
// mantig'i `HemisSyncPage` da joylashadi.

import { useTranslation } from 'react-i18next'
import { Loader2, RefreshCw } from 'lucide-react'

import type { SyncJob, SyncStatus, SyncType } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { cn } from '@/shared/lib/utils'

import { computeProgressPct } from '../../lib/progress'
import { isActiveSyncStatus } from '../api/use-hemis-sync'

/** Sinxronlash turlari — tugmalar shu tartibda render qilinadi (Req 12.1). */
const SYNC_TYPES: readonly SyncType[] = ['students', 'teachers', 'courses']

/** Har bir holat uchun ko'rsatkich nuqtasining rangi. */
const STATUS_DOT_CLASS: Record<SyncStatus, string> = {
  started: 'bg-amber-500',
  running: 'bg-blue-500 animate-pulse',
  completed: 'bg-green-500',
  error: 'bg-destructive',
}

export interface SyncControlsProps {
  /** Hozirda faol/oxirgi job (null bo'lsa hali sinxronlash boshlanmagan). */
  activeJob: SyncJob | null
  /** Mutation jarayonda ekanini bildiradi (tugmalarni bloklash uchun). */
  isStarting: boolean
  /** Hozir ishga tushirilayotgan tur (faqat o'sha tugmada spinner ko'rsatish). */
  pendingType: SyncType | null
  /** Sinxronlash tugmasi bosilganda chaqiriladi (Req 12.2). */
  onStart: (type: SyncType) => void
}

/** Holat ko'rsatkichi — rangli nuqta + matn (Req 12.2). */
function StatusIndicator({ status }: { status: SyncStatus | null }) {
  const { t } = useTranslation()
  const key = status ?? 'idle'
  return (
    <div className="flex items-center gap-2" aria-live="polite">
      <span className="text-sm text-muted-foreground">
        {t('admin.sync.status.label')}:
      </span>
      <span
        className={cn(
          'inline-block size-2.5 rounded-full',
          status ? STATUS_DOT_CLASS[status] : 'bg-muted-foreground/40',
        )}
        aria-hidden="true"
      />
      <span className="text-sm font-medium" data-testid="sync-status">
        {t(`admin.sync.status.${key}`)}
      </span>
    </div>
  )
}

/** Progress bar — `computeProgressPct` orqali clamp qilingan foiz (Req 12.3). */
function SyncProgress({ job }: { job: SyncJob }) {
  const { t } = useTranslation()
  const pct = computeProgressPct(job.processed, job.total ?? 0)
  const rounded = Math.round(pct)
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {t('admin.sync.progress.processed', { count: job.processed })}
        </span>
        <span className="tabular-nums font-medium">{rounded}%</span>
      </div>
      <div
        role="progressbar"
        aria-label={t('admin.sync.progress.label')}
        aria-valuenow={rounded}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

/**
 * Sinxronlash boshqaruvi kartochkasi: 3 ta tugma, holat ko'rsatkichi va
 * (job faol bo'lganda) progress bar.
 */
export function SyncControls({
  activeJob,
  isStarting,
  pendingType,
  onStart,
}: SyncControlsProps) {
  const { t } = useTranslation()
  const isRunning = activeJob != null && isActiveSyncStatus(activeJob.status)
  // Sinxronlash davom etayotganda yoki so'rov yuborilayotganda yangi
  // sinxronlashni bloklaymiz — bir vaqtda bitta job.
  const buttonsDisabled = isStarting || isRunning

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg">{t('admin.sync.controls.title')}</CardTitle>
        <StatusIndicator status={activeJob?.status ?? null} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          {SYNC_TYPES.map((type) => {
            const isPending = isStarting && pendingType === type
            return (
              <Button
                key={type}
                onClick={() => onStart(type)}
                disabled={buttonsDisabled}
                variant="default"
              >
                {isPending ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : (
                  <RefreshCw aria-hidden="true" />
                )}
                {t(`admin.sync.controls.${type}`)}
              </Button>
            )
          })}
        </div>

        {isRunning && activeJob ? <SyncProgress job={activeJob} /> : null}
      </CardContent>
    </Card>
  )
}

export default SyncControls
