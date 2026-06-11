// Talaba kurslari ro'yxati sahifasi (Req 3.2, 3.6).
//
// Kurslar backend-dan sahifalash (pagination) bilan yuklanadi va jadval
// ko'rinishida (nom, o'qituvchi, progress) ko'rsatiladi. Qidiruv maydoni
// `searchCourses` toza funksiyasiga ulangan — joriy sahifadagi kurslar nom
// yoki o'qituvchi ismi bo'yicha case-insensitive filtrlanadi. Yuklanish
// paytida skeleton, xatoda esa "Qayta urinish" tugmasi ko'rsatiladi.
// Barcha matnlar `react-i18next` orqali tarjima qilinadi.

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { AlertCircle, Search } from 'lucide-react'

import { searchCourses } from '@/shared/lib/search'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'

import {
  STUDENT_COURSES_PAGE_SIZE,
  useStudentCourses,
} from '../api/use-student-courses'

/** Yuklanish paytida ko'rsatiladigan jadval skeletoni (Req 3.4). */
function CoursesSkeleton() {
  const { t } = useTranslation()
  return (
    <div
      className="space-y-3"
      role="status"
      aria-busy="true"
      aria-label={t('common.loading')}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="h-12 w-full animate-pulse rounded bg-muted" />
      ))}
    </div>
  )
}

interface CoursesErrorProps {
  onRetry: () => void
}

/** Backend xatosida ko'rsatiladigan xato holati va "Qayta urinish" (Req 3.5). */
function CoursesError({ onRetry }: CoursesErrorProps) {
  const { t } = useTranslation()
  return (
    <Card role="alert" className="border-destructive">
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <AlertCircle className="size-5 text-destructive" aria-hidden="true" />
        <CardTitle className="text-lg text-destructive">
          {t('student.courses.errorTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t('student.courses.errorDescription')}
        </p>
        <Button onClick={onRetry} variant="outline">
          {t('student.courses.retry')}
        </Button>
      </CardContent>
    </Card>
  )
}

/**
 * Talaba kurslari ro'yxatining asosiy komponenti. Sahifalash, qidiruv,
 * yuklanish va xato holatlarini boshqaradi (Req 3.2, 3.6).
 */
export function StudentCourses() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')

  const { data, isLoading, isError, isPlaceholderData, refetch } =
    useStudentCourses(page, STUDENT_COURSES_PAGE_SIZE)

  // Joriy sahifadagi kurslarni qidiruv so'roviga ko'ra filtrlash (Req 3.6).
  const visibleCourses = useMemo(
    () => searchCourses(data?.items ?? [], query),
    [data?.items, query],
  )

  const total = data?.total ?? 0
  const pageSize = data?.pageSize ?? STUDENT_COURSES_PAGE_SIZE
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const canGoPrev = page > 1
  const canGoNext = page < totalPages

  return (
    <main className="space-y-6 p-6" aria-labelledby="student-courses-title">
      <h1 id="student-courses-title" className="text-2xl font-bold">
        {t('student.courses.title')}
      </h1>

      {/* Qidiruv maydoni (Req 3.6) */}
      <div className="relative max-w-sm">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('student.courses.searchPlaceholder')}
          aria-label={t('student.courses.searchPlaceholder')}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <CoursesSkeleton />
      ) : isError || !data ? (
        <CoursesError onRetry={() => void refetch()} />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('student.courses.columns.title')}</TableHead>
                <TableHead>{t('student.courses.columns.teacher')}</TableHead>
                <TableHead className="text-right">
                  {t('student.courses.columns.progress')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleCourses.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground"
                  >
                    {t('student.courses.empty')}
                  </TableCell>
                </TableRow>
              ) : (
                visibleCourses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">
                      <Link
                        to={`/student/courses/${course.id}`}
                        className="hover:underline focus-visible:underline focus-visible:outline-none"
                      >
                        {course.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {course.teacherName}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {course.progressPercent}%
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Sahifalash boshqaruvi (Req 3.2) */}
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {t('student.courses.pageInfo', { current: page, total: totalPages })}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!canGoPrev || isPlaceholderData}
              >
                {t('buttons.back')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!canGoNext || isPlaceholderData}
              >
                {t('buttons.next')}
              </Button>
            </div>
          </div>
        </>
      )}
    </main>
  )
}

export default StudentCourses
