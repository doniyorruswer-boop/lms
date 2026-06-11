// Talaba davomat tarixi jadvali (Req 9.4).
//
// Talabaning davomat yozuvlarini sana, kurs nomi, kirish va chiqish vaqtlari
// bilan jadval ko'rinishida ko'rsatadi. Yuklanishda skeleton, xatoda "Qayta
// urinish" tugmasi, bo'sh ro'yxatda esa ma'lumot yo'qligi xabari ko'rsatiladi.
// Barcha matnlar `react-i18next` orqali tarjima qilinadi.

import { useTranslation } from 'react-i18next'

import type { AttendanceRecord } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'

import { useAttendanceHistory } from '../api/use-attendance-history'
import { formatClockTime, formatDate } from '../lib/format-time'

interface AttendanceHistoryTableProps {
  records: AttendanceRecord[]
}

/** Davomat yozuvlarini jadvalda ko'rsatadigan toza (presentational) komponent. */
export function AttendanceHistoryTable({
  records,
}: AttendanceHistoryTableProps) {
  const { t } = useTranslation()

  if (records.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t('attendance.history.empty')}
      </p>
    )
  }

  return (
    <Table>
      <TableCaption>{t('attendance.history.caption')}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>{t('attendance.history.date')}</TableHead>
          <TableHead>{t('attendance.history.course')}</TableHead>
          <TableHead>{t('attendance.history.checkIn')}</TableHead>
          <TableHead>{t('attendance.history.checkOut')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((record) => (
          <TableRow key={record.id}>
            <TableCell>{formatDate(record.date)}</TableCell>
            <TableCell>{record.courseTitle}</TableCell>
            <TableCell className="tabular-nums">
              {formatClockTime(record.checkInAt)}
            </TableCell>
            <TableCell className="tabular-nums">
              {formatClockTime(record.checkOutAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

/** Yuklanish paytida ko'rsatiladigan skeleton qatorlari. */
function HistorySkeleton() {
  const { t } = useTranslation()
  return (
    <div
      className="space-y-2"
      role="status"
      aria-busy="true"
      aria-label={t('common.loading')}
    >
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-10 w-full animate-pulse rounded bg-muted" />
      ))}
    </div>
  )
}

/**
 * Talaba davomat tarixini yuklab, jadvalda ko'rsatadigan asosiy komponent
 * (Req 9.4). Yuklanish, xato va muvaffaqiyat holatlarini boshqaradi.
 */
export function AttendanceHistory() {
  const { t } = useTranslation()
  const { data, isLoading, isError, refetch } = useAttendanceHistory()

  return (
    <section className="space-y-4" aria-labelledby="attendance-history-title">
      <h2 id="attendance-history-title" className="text-xl font-semibold">
        {t('attendance.history.title')}
      </h2>

      {isLoading ? (
        <HistorySkeleton />
      ) : isError || !data ? (
        <div role="alert" className="space-y-3">
          <p className="text-sm text-destructive">
            {t('attendance.history.error')}
          </p>
          <Button variant="outline" onClick={() => void refetch()}>
            {t('attendance.history.retry')}
          </Button>
        </div>
      ) : (
        <AttendanceHistoryTable records={data} />
      )}
    </section>
  )
}

export default AttendanceHistory
