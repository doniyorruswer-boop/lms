// Sinxronlash tarixi jadvali (Req 12.5) — sana, tur, holat va yakuniy hisobot.
//
// Xato bo'lgan satrlar uchun (Req 12.6) qatorni kengaytirib xato sababi va
// loglarni yuklab olish havolasi ko'rsatiladi.

import { useTranslation } from 'react-i18next'
import { AlertCircle, Download } from 'lucide-react'

import type { SyncJob, SyncStatus } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'
import { cn } from '@/shared/lib/utils'

export interface SyncHistoryTableProps {
  jobs: SyncJob[]
  /** Tarix satridagi xato logini yuklab olish havolasi bosilganda (Req 12.6). */
  onDownloadLog: (jobId: string) => void
  /** Hozir logi yuklab olinayotgan job id (spinner/disable uchun). */
  downloadingJobId?: string | null
}

const STATUS_TEXT_CLASS: Record<SyncStatus, string> = {
  started: 'text-amber-600',
  running: 'text-blue-600',
  completed: 'text-green-600',
  error: 'text-destructive',
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString()
}

/** Yakuniy hisobot xulosasi (qayta ishlangan/yangi/xato) yoki "—". */
function ReportSummary({ job }: { job: SyncJob }) {
  const { t } = useTranslation()
  if (job.status !== 'completed' && job.status !== 'error') {
    return <span className="text-muted-foreground">{t('admin.sync.history.inProgress')}</span>
  }
  return (
    <span className="tabular-nums">
      {t('admin.sync.history.reportSummary', {
        processed: job.processed,
        created: job.created,
        errors: job.errors,
      })}
    </span>
  )
}

/**
 * Sinxronizatsiya tarixini jadval ko'rinishida ko'rsatadi. Xato satrlar ostida
 * sabab va loglarni yuklab olish havolasi qo'shimcha qator sifatida render
 * qilinadi.
 */
export function SyncHistoryTable({
  jobs,
  onDownloadLog,
  downloadingJobId,
}: SyncHistoryTableProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('admin.sync.history.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.sync.history.date')}</TableHead>
              <TableHead>{t('admin.sync.history.type')}</TableHead>
              <TableHead>{t('admin.sync.history.status')}</TableHead>
              <TableHead>{t('admin.sync.history.report')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground"
                >
                  {t('admin.sync.history.empty')}
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="tabular-nums">
                    {formatDate(job.startedAt)}
                  </TableCell>
                  <TableCell>{t(`admin.sync.type.${job.type}`)}</TableCell>
                  <TableCell>
                    <span
                      className={cn('font-medium', STATUS_TEXT_CLASS[job.status])}
                    >
                      {t(`admin.sync.status.${job.status}`)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {job.status === 'error' ? (
                      <div className="flex flex-col gap-2">
                        <span className="flex items-center gap-1.5 text-sm text-destructive">
                          <AlertCircle className="size-4" aria-hidden="true" />
                          {job.errorMessage ?? t('admin.sync.error.unknown')}
                        </span>
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto justify-start p-0"
                          onClick={() => onDownloadLog(job.id)}
                          disabled={downloadingJobId === job.id}
                        >
                          <Download aria-hidden="true" />
                          {t('admin.sync.error.downloadLog')}
                        </Button>
                      </div>
                    ) : (
                      <ReportSummary job={job} />
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default SyncHistoryTable
