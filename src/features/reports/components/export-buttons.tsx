// Hisobot eksport tugmalari komponenti.
//
// Bu komponent CSV va PDF formatda eksport tugmalarini ta'minlaydi (Req 17.4, 17.5).
// Eksport vaqtida tugma blokirovkasi va progress indikatori ko'rsatiladi.

import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/button'
import { Progress } from '@/shared/ui/progress'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { FileText, Download, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

import { useExportReport, useExportStatus } from '../api/use-reports'
import type { ReportType, ReportFilters, ExportFormat, ExportStatus } from '../types'

interface ExportButtonsProps {
  /** Hisobot turi */
  reportType: ReportType
  /** Qo'llangan filtrlar */
  filters: ReportFilters
}

/** Eksport jarayoni davom etayotgan holatlar (tugma blokirovkasi uchun) */
const IN_PROGRESS_STATUSES: ReadonlyArray<ExportStatus['status']> = [
  'pending',
  'processing',
]

/**
 * CSV va PDF eksport tugmalari (Req 17.4, 17.5).
 *
 * Eksport vaqtida tugma blokirovkasi va progress indikatori
 * ko'rsatiladi. Tayyor bo'lganda yuklab olish imkonini beradi.
 */
export function ExportButtons({ reportType, filters }: ExportButtonsProps) {
  const { t } = useTranslation()
  // Faol eksportlar: ID -> joriy holat. Holat tugma blokirovkasini boshqaradi.
  const [activeExports, setActiveExports] = useState<
    Record<string, ExportStatus['status']>
  >({})

  const exportMutation = useExportReport()

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      try {
        const exportStatus = await exportMutation.mutateAsync({
          type: reportType,
          format,
          filters,
        })

        setActiveExports((prev) => ({
          ...prev,
          [exportStatus.id]: exportStatus.status,
        }))
      } catch (error) {
        console.error('Export failed:', error)
      }
    },
    [exportMutation, reportType, filters],
  )

  const handleStatusChange = useCallback(
    (exportId: string, status: ExportStatus['status']) => {
      setActiveExports((prev) => {
        if (prev[exportId] === status) return prev
        return { ...prev, [exportId]: status }
      })
    },
    [],
  )

  const handleComplete = useCallback((exportId: string) => {
    setActiveExports((prev) => {
      if (!(exportId in prev)) return prev
      const updated = { ...prev }
      delete updated[exportId]
      return updated
    })
  }, [])

  // Req 17.5: eksport jarayoni davom etayotgan bo'lsa tugmalar bloklanadi.
  const isExporting = useMemo(() => {
    if (exportMutation.isPending) return true
    return Object.values(activeExports).some((status) =>
      IN_PROGRESS_STATUSES.includes(status),
    )
  }, [exportMutation.isPending, activeExports])

  const activeExportIds = Object.keys(activeExports)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {/* CSV Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('reports.export.csv.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('reports.export.csv.description')}
            </p>
            <Button
              onClick={() => handleExport('csv')}
              disabled={isExporting}
              className="w-full"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {t('reports.export.csv.button')}
            </Button>
          </CardContent>
        </Card>

        {/* PDF Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('reports.export.pdf.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('reports.export.pdf.description')}
            </p>
            <Button
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
              className="w-full"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {t('reports.export.pdf.button')}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Eksport holatlarini kuzatish */}
      {activeExportIds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.export.status.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeExportIds.map((exportId) => (
                <ExportStatusCard
                  key={exportId}
                  exportId={exportId}
                  onStatusChange={handleStatusChange}
                  onComplete={handleComplete}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {exportMutation.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('reports.export.error')}: {exportMutation.error.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

interface ExportStatusCardProps {
  exportId: string
  onStatusChange: (exportId: string, status: ExportStatus['status']) => void
  onComplete: (exportId: string) => void
}

function ExportStatusCard({
  exportId,
  onStatusChange,
  onComplete,
}: ExportStatusCardProps) {
  const { t } = useTranslation()
  const { data: status } = useExportStatus(exportId)
  // Ota komponentni joriy holat haqida xabardor qilish (tugma blokirovkasi).
  const [lastReported, setLastReported] = useState<ExportStatus['status'] | null>(
    null,
  )

  if (status && status.status !== lastReported) {
    setLastReported(status.status)
    onStatusChange(exportId, status.status)
  }

  if (!status) {
    return (
      <div className="flex items-center gap-3 p-3 border rounded-lg">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">{t('reports.export.status.loading')}</span>
      </div>
    )
  }

  const handleDownload = () => {
    if (status.downloadUrl) {
      const link = document.createElement('a')
      link.href = status.downloadUrl
      link.download = `report-${status.format}-${Date.now()}.${status.format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      onComplete(exportId)
    }
  }

  return (
    <div className="p-3 border rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusIcon status={status.status} />
          <span className="font-medium">
            {status.format.toUpperCase()} {t('reports.export.status.export')}
          </span>
          <StatusBadge status={status.status} />
        </div>
        {status.status === 'completed' && status.downloadUrl && (
          <Button size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            {t('reports.export.status.download')}
          </Button>
        )}
      </div>

      {(status.status === 'processing' || status.status === 'pending') && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{t('reports.export.status.progress')}</span>
            <span>{status.progress}%</span>
          </div>
          <Progress value={status.progress} />
        </div>
      )}

      {status.status === 'error' && status.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{status.error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

function StatusIcon({ status }: { status: ExportStatus['status'] }) {
  switch (status) {
    case 'pending':
    case 'processing':
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" aria-hidden="true" />
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-500" aria-hidden="true" />
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-500" aria-hidden="true" />
    default:
      return null
  }
}

function StatusBadge({ status }: { status: ExportStatus['status'] }) {
  const { t } = useTranslation()

  const variants: Record<ExportStatus['status'], 'default' | 'secondary' | 'destructive'> = {
    pending: 'secondary',
    processing: 'default',
    completed: 'default',
    error: 'destructive',
  }

  return (
    <Badge variant={variants[status]}>
      {t(`reports.export.status.${status}`)}
    </Badge>
  )
}
