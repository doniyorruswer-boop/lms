// Hisobot jadval komponenti.
//
// Bu komponent hisobot ma'lumotlarini jadval ko'rinishida ko'rsatadi.
// Turli hisobot turlari uchun turli ustunlar va ma'lumotlar ko'rsatiladi.

import { useTranslation } from 'react-i18next'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'
import { Skeleton } from '@/shared/ui/skeleton'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { AlertCircle, FileX } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'

import { useReport } from '../api/use-reports'
import type {
  ReportType,
  ReportFilters,
  AttendanceReportRow,
  GradesReportRow,
  ProgressReportRow,
  CertificatesReportRow,
} from '../types'

interface ReportTableProps {
  /** Hisobot turi */
  reportType: ReportType
  /** Qo'llangan filtrlar */
  filters: ReportFilters
}

/**
 * Hisobot ma'lumotlarini jadval ko'rinishida ko'rsatadi.
 * Har bir hisobot turi uchun maxsus ustunlar va formatlar.
 */
export function ReportTable({ reportType, filters }: ReportTableProps) {
  const { t } = useTranslation()

  const {
    data: reportData,
    isLoading,
    error,
  } = useReport(reportType, filters)

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {t('reports.table.errorLoading')}
        </AlertDescription>
      </Alert>
    )
  }

  if (!reportData || reportData.data.length === 0) {
    return (
      <div className="text-center py-12">
        <FileX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">
          {t('reports.table.noData')}
        </h3>
        <p className="text-muted-foreground">
          {t('reports.table.noDataDescription')}
        </p>
      </div>
    )
  }

  const renderTable = () => {
    switch (reportType) {
      case 'attendance':
        return <AttendanceTable data={reportData.data as AttendanceReportRow[]} />
      case 'grades':
        return <GradesTable data={reportData.data as GradesReportRow[]} />
      case 'progress':
        return <ProgressTable data={reportData.data as ProgressReportRow[]} />
      case 'certificates':
        return <CertificatesTable data={reportData.data as CertificatesReportRow[]} />
      default:
        return <div>{t('reports.table.unsupportedType')}</div>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {t('reports.table.totalRecords', { count: reportData.data.length })}
        </p>
        <p className="text-sm text-muted-foreground">
          {t('reports.table.generatedAt', {
            date: new Date(reportData.generatedAt).toLocaleString(),
          })}
        </p>
      </div>
      <div className="border rounded-lg overflow-auto">{renderTable()}</div>
    </div>
  )
}

function AttendanceTable({ data }: { data: AttendanceReportRow[] }) {
  const { t } = useTranslation()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('reports.attendance.studentName')}</TableHead>
          <TableHead>{t('reports.attendance.courseTitle')}</TableHead>
          <TableHead className="text-right">{t('reports.attendance.totalLessons')}</TableHead>
          <TableHead className="text-right">{t('reports.attendance.attendedLessons')}</TableHead>
          <TableHead className="text-right">{t('reports.attendance.percentage')}</TableHead>
          <TableHead>{t('reports.attendance.lastAttendance')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, index) => (
          <TableRow key={index}>
            <TableCell className="font-medium">{row.studentName}</TableCell>
            <TableCell>{row.courseTitle}</TableCell>
            <TableCell className="text-right">{row.totalLessons}</TableCell>
            <TableCell className="text-right">{row.attendedLessons}</TableCell>
            <TableCell className="text-right">
              <Badge
                variant={
                  row.attendancePercentage >= 80
                    ? 'default'
                    : row.attendancePercentage >= 60
                    ? 'secondary'
                    : 'destructive'
                }
              >
                {row.attendancePercentage.toFixed(1)}%
              </Badge>
            </TableCell>
            <TableCell>
              {row.lastAttendance
                ? new Date(row.lastAttendance).toLocaleDateString()
                : t('common.noData')}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function GradesTable({ data }: { data: GradesReportRow[] }) {
  const { t } = useTranslation()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('reports.grades.studentName')}</TableHead>
          <TableHead>{t('reports.grades.courseTitle')}</TableHead>
          <TableHead>{t('reports.grades.assessmentTitle')}</TableHead>
          <TableHead className="text-right">{t('reports.grades.score')}</TableHead>
          <TableHead className="text-right">{t('reports.grades.maxScore')}</TableHead>
          <TableHead className="text-right">{t('reports.grades.percentage')}</TableHead>
          <TableHead>{t('reports.grades.submittedAt')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, index) => (
          <TableRow key={index}>
            <TableCell className="font-medium">{row.studentName}</TableCell>
            <TableCell>{row.courseTitle}</TableCell>
            <TableCell>{row.assessmentTitle}</TableCell>
            <TableCell className="text-right">{row.score}</TableCell>
            <TableCell className="text-right">{row.maxScore}</TableCell>
            <TableCell className="text-right">
              <Badge
                variant={
                  row.percentage >= 80
                    ? 'default'
                    : row.percentage >= 60
                    ? 'secondary'
                    : 'destructive'
                }
              >
                {row.percentage.toFixed(1)}%
              </Badge>
            </TableCell>
            <TableCell>
              {new Date(row.submittedAt).toLocaleDateString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function ProgressTable({ data }: { data: ProgressReportRow[] }) {
  const { t } = useTranslation()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('reports.progress.studentName')}</TableHead>
          <TableHead>{t('reports.progress.courseTitle')}</TableHead>
          <TableHead className="text-right">{t('reports.progress.lessonsCompleted')}</TableHead>
          <TableHead className="text-right">{t('reports.progress.totalLessons')}</TableHead>
          <TableHead className="text-right">{t('reports.progress.percentage')}</TableHead>
          <TableHead>{t('reports.progress.lastActivity')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, index) => (
          <TableRow key={index}>
            <TableCell className="font-medium">{row.studentName}</TableCell>
            <TableCell>{row.courseTitle}</TableCell>
            <TableCell className="text-right">{row.lessonsCompleted}</TableCell>
            <TableCell className="text-right">{row.totalLessons}</TableCell>
            <TableCell className="text-right">
              <Badge
                variant={
                  row.progressPercentage >= 80
                    ? 'default'
                    : row.progressPercentage >= 60
                    ? 'secondary'
                    : 'destructive'
                }
              >
                {row.progressPercentage.toFixed(1)}%
              </Badge>
            </TableCell>
            <TableCell>
              {row.lastActivity
                ? new Date(row.lastActivity).toLocaleDateString()
                : t('common.noData')}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function CertificatesTable({ data }: { data: CertificatesReportRow[] }) {
  const { t } = useTranslation()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('reports.certificates.studentName')}</TableHead>
          <TableHead>{t('reports.certificates.courseTitle')}</TableHead>
          <TableHead>{t('reports.certificates.certificateNumber')}</TableHead>
          <TableHead>{t('reports.certificates.issuedAt')}</TableHead>
          <TableHead>{t('reports.certificates.status')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, index) => (
          <TableRow key={index}>
            <TableCell className="font-medium">{row.studentName}</TableCell>
            <TableCell>{row.courseTitle}</TableCell>
            <TableCell className="font-mono text-sm">
              {row.certificateNumber}
            </TableCell>
            <TableCell>
              {new Date(row.issuedAt).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <Badge variant={row.isVerified ? 'default' : 'secondary'}>
                {row.isVerified
                  ? t('reports.certificates.verified')
                  : t('reports.certificates.pending')}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}