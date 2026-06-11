// Student dashboard sahifasi (Req 3.1, 3.4, 3.5).
//
// Talabaning faol kurslari, yaqinlashayotgan baholashlari va umumiy davomat
// foizini bitta ekranda ko'rsatadi. Ma'lumot yuklanayotganda skeleton loader,
// backend xatosida esa xato xabari va "Qayta urinish" tugmasi ko'rsatiladi.
// Barcha matnlar `react-i18next` orqali tarjima qilinadi.

import { useTranslation } from 'react-i18next'
import { AlertCircle, BookOpen, CalendarClock, UserCheck } from 'lucide-react'

import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'

import {
  useStudentDashboard,
  type StudentDashboardData,
} from '../api/use-student-dashboard'

/** Yuklanish paytida ko'rsatiladigan skeleton loader (Req 3.4). */
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

/** Backend xatosida ko'rsatiladigan xato holati va "Qayta urinish" (Req 3.5). */
function DashboardError({ onRetry }: DashboardErrorProps) {
  const { t } = useTranslation()
  return (
    <Card role="alert" className="border-destructive">
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <AlertCircle className="size-5 text-destructive" aria-hidden="true" />
        <CardTitle className="text-lg text-destructive">
          {t('student.dashboard.errorTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t('student.dashboard.errorDescription')}
        </p>
        <Button onClick={onRetry} variant="outline">
          {t('student.dashboard.retry')}
        </Button>
      </CardContent>
    </Card>
  )
}

interface DashboardContentProps {
  data: StudentDashboardData
}

/** Muvaffaqiyatli yuklanganda dashboard mazmunini ko'rsatadi (Req 3.1). */
function DashboardContent({ data }: DashboardContentProps) {
  const { t } = useTranslation()
  const { activeCourses, upcomingAssessments, attendancePercent } = data

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Faol kurslar */}
      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <BookOpen className="size-5 text-primary" aria-hidden="true" />
          <div className="space-y-1">
            <CardTitle className="text-lg">
              {t('student.dashboard.activeCourses')}
            </CardTitle>
            <CardDescription>
              {t('student.dashboard.activeCoursesCount', {
                count: activeCourses.length,
              })}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {activeCourses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('student.dashboard.noCourses')}
            </p>
          ) : (
            <ul className="space-y-2">
              {activeCourses.map((course) => (
                <li
                  key={course.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="truncate">{course.title}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {course.progressPercent}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Yaqinlashayotgan baholashlar */}
      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <CalendarClock className="size-5 text-primary" aria-hidden="true" />
          <div className="space-y-1">
            <CardTitle className="text-lg">
              {t('student.dashboard.upcomingAssessments')}
            </CardTitle>
            <CardDescription>
              {t('student.dashboard.upcomingAssessmentsCount', {
                count: upcomingAssessments.length,
              })}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {upcomingAssessments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('student.dashboard.noAssessments')}
            </p>
          ) : (
            <ul className="space-y-2">
              {upcomingAssessments.map((assessment) => (
                <li
                  key={assessment.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="truncate">{assessment.title}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {t(`student.dashboard.assessmentType.${assessment.type}`)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Umumiy davomat foizi */}
      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <UserCheck className="size-5 text-primary" aria-hidden="true" />
          <div className="space-y-1">
            <CardTitle className="text-lg">
              {t('student.dashboard.attendance')}
            </CardTitle>
            <CardDescription>
              {t('student.dashboard.attendanceDescription')}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-semibold tabular-nums">
            {attendancePercent}
            <span className="text-2xl text-muted-foreground">%</span>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Student dashboard sahifasining asosiy komponenti. Yuklanish, xato va
 * muvaffaqiyat holatlarini boshqaradi (Req 3.1, 3.4, 3.5).
 */
export function StudentDashboard() {
  const { t } = useTranslation()
  const { data, isLoading, isError, refetch } = useStudentDashboard()

  return (
    <main className="space-y-6 p-6" aria-labelledby="student-dashboard-title">
      <h1 id="student-dashboard-title" className="text-2xl font-bold">
        {t('student.dashboard.title')}
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

export default StudentDashboard
