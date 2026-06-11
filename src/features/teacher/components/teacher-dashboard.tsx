// O'qituvchi dashboard sahifasi (Req 10.1).
//
// O'qituvchining faol kurslari, yaqin kunlardagi darslari va baholanmagan
// ishlar sonini bitta ekranda ko'rsatadi. Ma'lumot yuklanayotganda skeleton
// loader, backend xatosida esa xato xabari va "Qayta urinish" tugmasi
// ko'rsatiladi. Barcha matnlar `react-i18next` orqali tarjima qilinadi.

import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { AlertCircle, BookOpen, CalendarClock, ClipboardCheck } from 'lucide-react'

import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'

import {
  useTeacherDashboard,
  type TeacherDashboardData,
} from '../api/use-teacher-dashboard'

/** Yuklanish paytida ko'rsatiladigan skeleton loader (Req 10.1). */
function DashboardSkeleton() {
  const { t } = useTranslation()
  return (
    <div
      className="grid gap-4 md:grid-cols-3"
      role="status"
      aria-busy="true"
      aria-label={t('common.loading')}
    >
      {[0, 1, 2].map((i) => (
        <Card key={i}>
          <CardHeader>
            <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

interface DashboardErrorProps {
  onRetry: () => void
}

/** Backend xatosida ko'rsatiladigan xato holati va "Qayta urinish" (Req 10.1). */
function DashboardError({ onRetry }: DashboardErrorProps) {
  const { t } = useTranslation()
  return (
    <Card role="alert" className="border-destructive">
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <AlertCircle className="size-5 text-destructive" aria-hidden="true" />
        <CardTitle className="text-lg text-destructive">
          {t('teacher.dashboard.errorTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t('teacher.dashboard.errorDescription')}
        </p>
        <Button onClick={onRetry} variant="outline">
          {t('teacher.dashboard.retry')}
        </Button>
      </CardContent>
    </Card>
  )
}

interface DashboardContentProps {
  data: TeacherDashboardData
}

/** Muvaffaqiyatli yuklanganda dashboard mazmunini ko'rsatadi (Req 10.1). */
function DashboardContent({ data }: DashboardContentProps) {
  const { t } = useTranslation()
  const { activeCourses, upcomingLessons, ungradedCount } = data

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Faol kurslar */}
      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <BookOpen className="size-5 text-primary" aria-hidden="true" />
          <div className="space-y-1">
            <CardTitle className="text-lg">
              {t('teacher.dashboard.activeCourses')}
            </CardTitle>
            <CardDescription>
              {t('teacher.dashboard.activeCoursesCount', {
                count: activeCourses.length,
              })}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {activeCourses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('teacher.dashboard.noCourses')}
            </p>
          ) : (
            <ul className="space-y-2">
              {activeCourses.map((course) => (
                <li key={course.id} className="text-sm">
                  <Link
                    to={`/teacher/courses/${course.id}`}
                    className="hover:underline focus-visible:underline focus-visible:outline-none"
                  >
                    {course.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Yaqin darslar */}
      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <CalendarClock className="size-5 text-primary" aria-hidden="true" />
          <div className="space-y-1">
            <CardTitle className="text-lg">
              {t('teacher.dashboard.upcomingLessons')}
            </CardTitle>
            <CardDescription>
              {t('teacher.dashboard.upcomingLessonsCount', {
                count: upcomingLessons.length,
              })}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {upcomingLessons.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('teacher.dashboard.noLessons')}
            </p>
          ) : (
            <ul className="space-y-2">
              {upcomingLessons.map((lesson) => (
                <li
                  key={lesson.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="truncate">{lesson.title}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {lesson.date}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Baholanmagan ishlar soni */}
      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <ClipboardCheck className="size-5 text-primary" aria-hidden="true" />
          <div className="space-y-1">
            <CardTitle className="text-lg">
              {t('teacher.dashboard.ungraded')}
            </CardTitle>
            <CardDescription>
              {t('teacher.dashboard.ungradedDescription')}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-semibold tabular-nums">{ungradedCount}</p>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * O'qituvchi dashboard sahifasining asosiy komponenti. Yuklanish, xato va
 * muvaffaqiyat holatlarini boshqaradi (Req 10.1).
 */
export function TeacherDashboard() {
  const { t } = useTranslation()
  const { data, isLoading, isError, refetch } = useTeacherDashboard()

  return (
    <main className="space-y-6 p-6" aria-labelledby="teacher-dashboard-title">
      <h1 id="teacher-dashboard-title" className="text-2xl font-bold">
        {t('teacher.dashboard.title')}
      </h1>

      {isLoading ? (
        <DashboardSkeleton />
      ) : isError || !data ? (
        <DashboardError onRetry={() => void refetch()} />
      ) : (
        <DashboardContent data={data} />
      )}
    </main>
  )
}

export default TeacherDashboard
