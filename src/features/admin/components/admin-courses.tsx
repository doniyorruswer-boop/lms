// Admin kurslar ro'yxati sahifasi (Req 11.2).
//
// Kurslar backend-dan sahifalash (pagination) bilan yuklanadi va jadval
// ko'rinishida (nom, yo'nalish, semestr, o'qituvchi, sig'im) ko'rsatiladi.
// Ta'lim yo'nalishi/semestr/o'qituvchi bo'yicha filtrlar joriy sahifa ustida
// `filterCourses` toza funksiyasi orqali qo'llanadi (Req 11.2). Yo'nalish
// filtri sobit enumdan, semestr va o'qituvchi filtrlari esa yuklangan
// ma'lumotdagi mavjud qiymatlardan (`distinct`) hosil qilinadi. Komponent kurs
// yaratish formasini ochish/yopish boshqaruvini ham o'z ichiga oladi (Req 11.3).

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle, Plus } from 'lucide-react'

import type { DirectionType } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'

import {
  ADMIN_COURSES_PAGE_SIZE,
  useAdminCourses,
} from '../api/use-admin-courses'
import { distinct, filterCourses } from '../lib/filters'
import { EMPTY_COURSE_FILTERS, type CourseFilters } from '../types'
import { CourseForm } from './course-form'
import { FilterSelect, type FilterSelectOption } from './filter-select'

const DIRECTIONS: readonly DirectionType[] = ['BACHELOR', 'MASTER'] as const

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

function CoursesError({ onRetry }: CoursesErrorProps) {
  const { t } = useTranslation()
  return (
    <Card role="alert" className="border-destructive">
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <AlertCircle className="size-5 text-destructive" aria-hidden="true" />
        <CardTitle className="text-lg text-destructive">
          {t('admin.courses.errorTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t('admin.courses.errorDescription')}
        </p>
        <Button onClick={onRetry} variant="outline">
          {t('admin.courses.retry')}
        </Button>
      </CardContent>
    </Card>
  )
}

/**
 * Admin kurslar ro'yxatining asosiy komponenti (Req 11.2). Kurs yaratish
 * formasini ochish/yopish boshqaruvini ham o'z ichiga oladi (Req 11.3).
 */
export function AdminCourses() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<CourseFilters>(EMPTY_COURSE_FILTERS)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const { data, isLoading, isError, isPlaceholderData, refetch } =
    useAdminCourses(page, ADMIN_COURSES_PAGE_SIZE)

  const items = useMemo(() => data?.items ?? [], [data?.items])
  const visibleCourses = useMemo(
    () => filterCourses(items, filters),
    [items, filters],
  )

  const directionOptions = useMemo<FilterSelectOption[]>(
    () =>
      DIRECTIONS.map((d) => ({
        value: d,
        label: t(`admin.directions.${d}`),
      })),
    [t],
  )

  const semesterOptions = useMemo<FilterSelectOption[]>(() => {
    const semesters = distinct(items.map((c) => c.semester)).sort(
      (a, b) => a - b,
    )
    return semesters.map((s) => ({
      value: String(s),
      label: t('admin.courses.semesterLabel', { semester: s }),
    }))
  }, [items, t])

  const teacherOptions = useMemo<FilterSelectOption[]>(() => {
    const ids = distinct(items.map((c) => c.teacherId))
    return ids.map((id) => ({
      value: id,
      label: items.find((c) => c.teacherId === id)?.teacherName ?? id,
    }))
  }, [items])

  const total = data?.total ?? 0
  const pageSize = data?.pageSize ?? ADMIN_COURSES_PAGE_SIZE
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const canGoPrev = page > 1
  const canGoNext = page < totalPages

  function updateFilter<K extends keyof CourseFilters>(
    key: K,
    value: CourseFilters[K],
  ) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <main className="space-y-6 p-6" aria-labelledby="admin-courses-title">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 id="admin-courses-title" className="text-2xl font-bold">
          {t('admin.courses.title')}
        </h1>
        <Button onClick={() => setIsFormOpen((v) => !v)}>
          <Plus aria-hidden="true" />
          {t('admin.courses.create')}
        </Button>
      </div>

      {isFormOpen && (
        <CourseForm
          onSuccess={() => setIsFormOpen(false)}
          onCancel={() => setIsFormOpen(false)}
        />
      )}

      {/* Filtrlar (Req 11.2) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FilterSelect
          id="courses-filter-direction"
          label={t('admin.courses.filters.direction')}
          value={filters.direction ?? ''}
          options={directionOptions}
          allLabel={t('admin.filters.all')}
          onChange={(v) =>
            updateFilter('direction', v as CourseFilters['direction'])
          }
        />
        <FilterSelect
          id="courses-filter-semester"
          label={t('admin.courses.filters.semester')}
          value={filters.semester ?? ''}
          options={semesterOptions}
          allLabel={t('admin.filters.all')}
          onChange={(v) => updateFilter('semester', v)}
        />
        <FilterSelect
          id="courses-filter-teacher"
          label={t('admin.courses.filters.teacher')}
          value={filters.teacherId ?? ''}
          options={teacherOptions}
          allLabel={t('admin.filters.all')}
          onChange={(v) => updateFilter('teacherId', v)}
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
                <TableHead>{t('admin.courses.columns.title')}</TableHead>
                <TableHead>{t('admin.courses.columns.direction')}</TableHead>
                <TableHead>{t('admin.courses.columns.semester')}</TableHead>
                <TableHead>{t('admin.courses.columns.teacher')}</TableHead>
                <TableHead className="text-right">
                  {t('admin.courses.columns.capacity')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleCourses.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground"
                  >
                    {t('admin.courses.empty')}
                  </TableCell>
                </TableRow>
              ) : (
                visibleCourses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">
                      {course.title}
                    </TableCell>
                    <TableCell>
                      {t(`admin.directions.${course.direction}`)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {t('admin.courses.semesterLabel', {
                        semester: course.semester,
                      })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {course.teacherName}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {course.enrolledCount} / {course.capacity}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Sahifalash boshqaruvi (Req 11.2) */}
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {t('admin.pageInfo', { current: page, total: totalPages })}
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

export default AdminCourses
