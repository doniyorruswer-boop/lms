// Monitoring_Panel — vazirlik darajasidagi monitoring sahifasi
// (Req 13.1–13.6).
//
// Ko'rsatadi: umumiy indikator kartochkalari (talaba/o'qituvchi/kurs),
// OTM bo'yicha o'qituvchi-talaba nisbati jadvali va diagrammasi (1:50 dan
// oshganda qizil ajratish + "Norma buzilgan" yorlig'i), ta'lim yo'nalishi/OTM
// bo'yicha kontingent diagrammasi, sana oralig'i filtri (qayta yuklash) va
// CSV/PDF eksport tugmalari. Barcha matnlar `react-i18next` orqali tarjima
// qilinadi.

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  Download,
  FileText,
  GraduationCap,
  Users,
} from 'lucide-react'

import { API_BASE_URL } from '@/shared/api/client'
import { endpoints } from '@/shared/api/endpoints'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
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
import { Input } from '@/shared/ui/input'
import type { ContingentStat, OtmStats } from '@/shared/types'

import { computeIndicatorTotals } from '../lib/aggregate'
import { buildContingentCsv, buildOtmStatsCsv } from '../lib/csv'
import { downloadCsv, exportPdf } from '../lib/download'
import { isRatioViolation } from '../lib/ratio'
import {
  EMPTY_DATE_RANGE,
  useMonitoringData,
  type MonitoringData,
  type MonitoringDateRange,
} from '../api/use-monitoring'

/** Yuklanish paytida ko'rsatiladigan skeleton loader. */
function MonitoringSkeleton() {
  const { t } = useTranslation()
  return (
    <div
      className="space-y-4"
      role="status"
      aria-busy="true"
      aria-label={t('common.loading')}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-1/3 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="h-64 w-full animate-pulse rounded bg-muted" />
    </div>
  )
}

interface MonitoringErrorProps {
  onRetry: () => void
}

/** Backend xatosida ko'rsatiladigan xato holati va "Qayta urinish". */
function MonitoringError({ onRetry }: MonitoringErrorProps) {
  const { t } = useTranslation()
  return (
    <Card role="alert" className="border-destructive">
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <AlertCircle className="size-5 text-destructive" aria-hidden="true" />
        <CardTitle className="text-lg text-destructive">
          {t('monitoring.errorTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t('monitoring.errorDescription')}
        </p>
        <Button onClick={onRetry} variant="outline">
          {t('monitoring.retry')}
        </Button>
      </CardContent>
    </Card>
  )
}

interface IndicatorCardProps {
  icon: React.ReactNode
  label: string
  value: number
}

/** Bitta umumiy indikator kartochkasi (Req 13.1). */
function IndicatorCard({ icon, label, value }: IndicatorCardProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3 space-y-0 pb-2">
        {icon}
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  )
}

/** Indikator kartochkalari qatori (Req 13.1). */
function IndicatorCards({ stats }: { stats: OtmStats[] }) {
  const { t } = useTranslation()
  const totals = useMemo(() => computeIndicatorTotals(stats), [stats])

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <IndicatorCard
        icon={<Users className="size-5 text-primary" aria-hidden="true" />}
        label={t('monitoring.indicators.students')}
        value={totals.students}
      />
      <IndicatorCard
        icon={
          <GraduationCap className="size-5 text-primary" aria-hidden="true" />
        }
        label={t('monitoring.indicators.teachers')}
        value={totals.teachers}
      />
      <IndicatorCard
        icon={<BookOpen className="size-5 text-primary" aria-hidden="true" />}
        label={t('monitoring.indicators.courses')}
        value={totals.courses}
      />
    </div>
  )
}

/** OTM bo'yicha nisbat jadvali — buzilgan OTM qizil ajratiladi (Req 13.2, 13.3). */
function RatioTable({ stats }: { stats: OtmStats[] }) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('monitoring.table.title')}</CardTitle>
        <CardDescription>{t('monitoring.table.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {stats.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('monitoring.table.empty')}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('monitoring.table.otm')}</TableHead>
                <TableHead className="text-right">
                  {t('monitoring.table.students')}
                </TableHead>
                <TableHead className="text-right">
                  {t('monitoring.table.teachers')}
                </TableHead>
                <TableHead className="text-right">
                  {t('monitoring.table.courses')}
                </TableHead>
                <TableHead className="text-right">
                  {t('monitoring.table.ratio')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.map((s) => {
                const violation = isRatioViolation(
                  s.studentCount,
                  s.teacherCount,
                )
                return (
                  <TableRow
                    key={s.otmId}
                    className={
                      violation ? 'bg-destructive/10 text-destructive' : undefined
                    }
                    data-violation={violation ? 'true' : undefined}
                  >
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        {s.otmName}
                        {violation ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground">
                            <AlertTriangle
                              className="size-3"
                              aria-hidden="true"
                            />
                            {t('monitoring.table.violation')}
                          </span>
                        ) : null}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {s.studentCount}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {s.teacherCount}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {s.courseCount}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      1:{s.ratio}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

/** OTM bo'yicha nisbat diagrammasi (gorizontal bar, a11y-friendly). */
function RatioChart({ stats }: { stats: OtmStats[] }) {
  const { t } = useTranslation()
  const max = Math.max(50, ...stats.map((s) => s.ratio), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('monitoring.chart.title')}</CardTitle>
        <CardDescription>{t('monitoring.chart.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {stats.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('monitoring.table.empty')}
          </p>
        ) : (
          <ul className="space-y-3" aria-label={t('monitoring.chart.title')}>
            {stats.map((s) => {
              const violation = isRatioViolation(s.studentCount, s.teacherCount)
              const widthPct = Math.min(100, (s.ratio / max) * 100)
              return (
                <li key={s.otmId} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{s.otmName}</span>
                    <span className="tabular-nums">1:{s.ratio}</span>
                  </div>
                  <div
                    className="h-3 w-full overflow-hidden rounded-full bg-muted"
                    role="img"
                    aria-label={`${s.otmName}: 1:${s.ratio}`}
                  >
                    <div
                      className={
                        violation
                          ? 'h-full rounded-full bg-destructive'
                          : 'h-full rounded-full bg-primary'
                      }
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

/** Ta'lim yo'nalishi/OTM bo'yicha kontingent diagrammasi (Req 13.4). */
function ContingentChart({ stats }: { stats: ContingentStat[] }) {
  const { t } = useTranslation()
  const max = Math.max(
    1,
    ...stats.map((s) => Math.max(s.bachelorCount, s.masterCount)),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('monitoring.contingent.title')}</CardTitle>
        <CardDescription>
          {t('monitoring.contingent.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {stats.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('monitoring.contingent.empty')}
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1">
                <span className="size-3 rounded-sm bg-primary" aria-hidden="true" />
                {t('monitoring.contingent.bachelor')}
              </span>
              <span className="flex items-center gap-1">
                <span
                  className="size-3 rounded-sm bg-secondary"
                  aria-hidden="true"
                />
                {t('monitoring.contingent.master')}
              </span>
            </div>
            <ul
              className="space-y-4"
              aria-label={t('monitoring.contingent.title')}
            >
              {stats.map((s) => (
                <li key={s.otmId} className="space-y-1">
                  <span className="text-sm font-medium">{s.otmName}</span>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 rounded-full bg-primary"
                        style={{
                          width: `${(s.bachelorCount / max) * 100}%`,
                        }}
                        role="img"
                        aria-label={`${t('monitoring.contingent.bachelor')}: ${s.bachelorCount}`}
                      />
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {s.bachelorCount}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 rounded-full bg-secondary"
                        style={{ width: `${(s.masterCount / max) * 100}%` }}
                        role="img"
                        aria-label={`${t('monitoring.contingent.master')}: ${s.masterCount}`}
                      />
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {s.masterCount}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface ToolbarProps {
  range: MonitoringDateRange
  onRangeChange: (range: MonitoringDateRange) => void
  onExportCsv: () => void
  onExportPdf: () => void
}

/** Sana oralig'i filtri va eksport tugmalari (Req 13.5, 13.6). */
function Toolbar({
  range,
  onRangeChange,
  onExportCsv,
  onExportPdf,
}: ToolbarProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">
            {t('monitoring.filter.from')}
          </span>
          <Input
            type="date"
            value={range.from}
            max={range.to || undefined}
            className="w-44"
            aria-label={t('monitoring.filter.from')}
            onChange={(e) =>
              onRangeChange({ ...range, from: e.target.value })
            }
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">
            {t('monitoring.filter.to')}
          </span>
          <Input
            type="date"
            value={range.to}
            min={range.from || undefined}
            className="w-44"
            aria-label={t('monitoring.filter.to')}
            onChange={(e) => onRangeChange({ ...range, to: e.target.value })}
          />
        </label>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onExportCsv}>
          <Download className="mr-2 size-4" aria-hidden="true" />
          {t('monitoring.export.csv')}
        </Button>
        <Button variant="outline" onClick={onExportPdf}>
          <FileText className="mr-2 size-4" aria-hidden="true" />
          {t('monitoring.export.pdf')}
        </Button>
      </div>
    </div>
  )
}

interface MonitoringContentProps {
  data: MonitoringData
  range: MonitoringDateRange
  onRangeChange: (range: MonitoringDateRange) => void
}

/** Muvaffaqiyatli yuklanganda monitoring panel mazmunini ko'rsatadi. */
function MonitoringContent({
  data,
  range,
  onRangeChange,
}: MonitoringContentProps) {
  const { t } = useTranslation()

  function handleExportCsv() {
    const otmCsv = buildOtmStatsCsv(data.otmStats, [
      t('monitoring.table.otm'),
      t('monitoring.table.students'),
      t('monitoring.table.teachers'),
      t('monitoring.table.courses'),
      t('monitoring.table.ratio'),
    ])
    const contingentCsv = buildContingentCsv(data.contingent, [
      t('monitoring.table.otm'),
      t('monitoring.contingent.bachelor'),
      t('monitoring.contingent.master'),
    ])
    downloadCsv('monitoring.csv', `${otmCsv}\r\n\r\n${contingentCsv}`)
  }

  function handleExportPdf() {
    const params = new URLSearchParams({ format: 'pdf' })
    if (range.from) params.set('from', range.from)
    if (range.to) params.set('to', range.to)
    exportPdf(`${API_BASE_URL}${endpoints.monitoring.export}?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      <IndicatorCards stats={data.otmStats} />
      <Toolbar
        range={range}
        onRangeChange={onRangeChange}
        onExportCsv={handleExportCsv}
        onExportPdf={handleExportPdf}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <RatioTable stats={data.otmStats} />
        <RatioChart stats={data.otmStats} />
      </div>
      <ContingentChart stats={data.contingent} />
      <p className="sr-only">{t('monitoring.title')}</p>
    </div>
  )
}

/**
 * Monitoring panelining asosiy komponenti. Yuklanish, xato va muvaffaqiyat
 * holatlarini boshqaradi; sana oralig'i filtri o'zgarganda ma'lumotni qayta
 * yuklaydi (Req 13.1–13.6).
 */
export function MonitoringDashboard() {
  const { t } = useTranslation()
  const [range, setRange] = useState<MonitoringDateRange>(EMPTY_DATE_RANGE)
  const { data, isLoading, isError, refetch } = useMonitoringData(range)

  return (
    <main className="space-y-6 p-6" aria-labelledby="monitoring-title">
      <h1 id="monitoring-title" className="text-2xl font-bold">
        {t('monitoring.title')}
      </h1>

      {isLoading ? (
        <MonitoringSkeleton />
      ) : isError || !data ? (
        <MonitoringError onRetry={() => void refetch()} />
      ) : (
        <MonitoringContent
          data={data}
          range={range}
          onRangeChange={setRange}
        />
      )}
    </main>
  )
}

export default MonitoringDashboard
