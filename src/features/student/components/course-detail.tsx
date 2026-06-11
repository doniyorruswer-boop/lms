// Kurs tafsiloti sahifasi (Req 3.3, 3.4, 3.5).
//
// Tanlangan kurs uchun darslar, materiallar, baholashlar va davomat
// ma'lumotlarini tab (Tabs) ko'rinishida ko'rsatadi. Ma'lumot yuklanayotganda
// skeleton, backend xatosida esa xato xabari va "Qayta urinish" tugmasi
// ko'rsatiladi. Barcha matnlar `react-i18next` orqali tarjima qilinadi.

import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'

import {
  useCourseDetail,
  type CourseDetailData,
} from '../api/use-course-detail'

/** Yuklanish paytida ko'rsatiladigan skeleton loader (Req 3.4). */
function DetailSkeleton() {
  const { t } = useTranslation()
  return (
    <div
      className="space-y-3"
      role="status"
      aria-busy="true"
      aria-label={t('common.loading')}
    >
      <div className="h-10 w-full animate-pulse rounded bg-muted" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-12 w-full animate-pulse rounded bg-muted" />
      ))}
    </div>
  )
}

interface DetailErrorProps {
  onRetry: () => void
}

/** Backend xatosida ko'rsatiladigan xato holati va "Qayta urinish" (Req 3.5). */
function DetailError({ onRetry }: DetailErrorProps) {
  const { t } = useTranslation()
  return (
    <Card role="alert" className="border-destructive">
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <AlertCircle className="size-5 text-destructive" aria-hidden="true" />
        <CardTitle className="text-lg text-destructive">
          {t('student.courseDetail.errorTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t('student.courseDetail.errorDescription')}
        </p>
        <Button onClick={onRetry} variant="outline">
          {t('student.courseDetail.retry')}
        </Button>
      </CardContent>
    </Card>
  )
}

/** Bo'sh tab uchun ko'rsatiladigan matn. */
function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="text-center text-muted-foreground">
        {label}
      </TableCell>
    </TableRow>
  )
}

interface DetailTabsProps {
  data: CourseDetailData
}

/** Kurs tafsiloti tablari: darslar, materiallar, baholashlar, davomat. */
function DetailTabs({ data }: DetailTabsProps) {
  const { t } = useTranslation()
  const { lessons, materials, assessments, attendance } = data

  return (
    <Tabs defaultValue="lessons">
      <TabsList>
        <TabsTrigger value="lessons">
          {t('student.courseDetail.tabs.lessons')}
        </TabsTrigger>
        <TabsTrigger value="materials">
          {t('student.courseDetail.tabs.materials')}
        </TabsTrigger>
        <TabsTrigger value="assessments">
          {t('student.courseDetail.tabs.assessments')}
        </TabsTrigger>
        <TabsTrigger value="attendance">
          {t('student.courseDetail.tabs.attendance')}
        </TabsTrigger>
      </TabsList>

      {/* Darslar */}
      <TabsContent value="lessons">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('student.courseDetail.lessons.title')}</TableHead>
              <TableHead>{t('student.courseDetail.lessons.date')}</TableHead>
              <TableHead className="text-right">
                {t('student.courseDetail.lessons.duration')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lessons.length === 0 ? (
              <EmptyRow colSpan={3} label={t('student.courseDetail.empty')} />
            ) : (
              lessons.map((lesson) => (
                <TableRow key={lesson.id}>
                  <TableCell className="font-medium">{lesson.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {lesson.date}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {t('student.courseDetail.lessons.minutes', {
                      count: lesson.durationMin,
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TabsContent>

      {/* Materiallar */}
      <TabsContent value="materials">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('student.courseDetail.materials.title')}</TableHead>
              <TableHead>{t('student.courseDetail.materials.type')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.length === 0 ? (
              <EmptyRow colSpan={2} label={t('student.courseDetail.empty')} />
            ) : (
              materials.map((material) => (
                <TableRow key={material.id}>
                  <TableCell className="font-medium">
                    <Link
                      to={`/student/materials?type=${encodeURIComponent(
                        material.type,
                      )}&url=${encodeURIComponent(
                        material.url,
                      )}&title=${encodeURIComponent(material.title)}`}
                      className="hover:underline focus-visible:underline focus-visible:outline-none"
                    >
                      {material.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {material.type}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TabsContent>

      {/* Baholashlar */}
      <TabsContent value="assessments">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                {t('student.courseDetail.assessments.title')}
              </TableHead>
              <TableHead>{t('student.courseDetail.assessments.type')}</TableHead>
              <TableHead className="text-right">
                {t('student.courseDetail.assessments.timer')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assessments.length === 0 ? (
              <EmptyRow colSpan={3} label={t('student.courseDetail.empty')} />
            ) : (
              assessments.map((assessment) => (
                <TableRow key={assessment.id}>
                  <TableCell className="font-medium">
                    {assessment.title}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {t(
                      `student.dashboard.assessmentType.${assessment.type}`,
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {t('student.courseDetail.assessments.minutes', {
                      count: assessment.timerMinutes,
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TabsContent>

      {/* Davomat */}
      <TabsContent value="attendance">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('student.courseDetail.attendance.date')}</TableHead>
              <TableHead>
                {t('student.courseDetail.attendance.checkIn')}
              </TableHead>
              <TableHead>
                {t('student.courseDetail.attendance.checkOut')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendance.length === 0 ? (
              <EmptyRow colSpan={3} label={t('student.courseDetail.empty')} />
            ) : (
              attendance.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.date}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {record.checkInAt ?? '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {record.checkOutAt ?? '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TabsContent>
    </Tabs>
  )
}

/**
 * Kurs tafsiloti sahifasining asosiy komponenti. Route paramidan `courseId`
 * ni oladi va yuklanish, xato hamda muvaffaqiyat holatlarini boshqaradi
 * (Req 3.3, 3.4, 3.5).
 */
export function CourseDetail() {
  const { t } = useTranslation()
  const { courseId = '' } = useParams<{ courseId: string }>()
  const { data, isLoading, isError, refetch } = useCourseDetail(courseId)

  return (
    <main className="space-y-6 p-6" aria-labelledby="course-detail-title">
      <h1 id="course-detail-title" className="text-2xl font-bold">
        {t('student.courseDetail.title')}
      </h1>

      {isLoading ? (
        <DetailSkeleton />
      ) : isError || !data ? (
        <DetailError onRetry={() => void refetch()} />
      ) : (
        <DetailTabs data={data} />
      )}
    </main>
  )
}

export default CourseDetail
