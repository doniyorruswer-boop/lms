// Yakuniy sinxronlash hisoboti (Req 12.4) va xato holati (Req 12.6).
//
// Job `completed` bo'lganda qayta ishlangan / yangi qo'shilgan / xato yozuvlar
// sonini ko'rsatadi. Job `error` bo'lganda esa xato sababi va loglarni yuklab
// olish havolasini ko'rsatadi.

import { useTranslation } from 'react-i18next'
import { AlertCircle, CheckCircle2, Download, Loader2 } from 'lucide-react'

import type { SyncJob } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'

export interface SyncFinalReportProps {
  /** Terminal holatdagi (completed yoki error) job. */
  job: SyncJob
  /** Xato loglarini yuklab olish havolasi bosilganda chaqiriladi (Req 12.6). */
  onDownloadLog: (jobId: string) => void
  /** Loglar hozir yuklab olinayotganini bildiradi. */
  isDownloading?: boolean
}

/** Bitta hisobot ko'rsatkichi (raqam + yorliq). */
function ReportStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-border p-4">
      <span className="text-2xl font-semibold tabular-nums">{value}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  )
}

/** Sinxronlash xatosi: sabab + loglarni yuklab olish havolasi (Req 12.6). */
function SyncErrorReport({
  job,
  onDownloadLog,
  isDownloading,
}: SyncFinalReportProps) {
  const { t } = useTranslation()
  return (
    <Card role="alert" className="border-destructive">
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <AlertCircle className="size-5 text-destructive" aria-hidden="true" />
        <CardTitle className="text-lg text-destructive">
          {t('admin.sync.error.reason')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {job.errorMessage ?? t('admin.sync.error.unknown')}
        </p>
        <Button
          variant="outline"
          onClick={() => onDownloadLog(job.id)}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <Download aria-hidden="true" />
          )}
          {isDownloading
            ? t('admin.sync.error.downloading')
            : t('admin.sync.error.downloadLog')}
        </Button>
      </CardContent>
    </Card>
  )
}

/**
 * Yakuniy hisobot/xato kartochkasi. Job holatiga qarab muvaffaqiyatli hisobot
 * yoki xato sababini ko'rsatadi.
 */
export function SyncFinalReport(props: SyncFinalReportProps) {
  const { t } = useTranslation()
  const { job } = props

  if (job.status === 'error') {
    return <SyncErrorReport {...props} />
  }

  if (job.status !== 'completed') {
    return null
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <CheckCircle2 className="size-5 text-green-600" aria-hidden="true" />
        <CardTitle className="text-lg">{t('admin.sync.report.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3">
          <ReportStat
            label={t('admin.sync.report.processed')}
            value={job.processed}
          />
          <ReportStat
            label={t('admin.sync.report.created')}
            value={job.created}
          />
          <ReportStat
            label={t('admin.sync.report.errors')}
            value={job.errors}
          />
        </div>
      </CardContent>
    </Card>
  )
}

export default SyncFinalReport
