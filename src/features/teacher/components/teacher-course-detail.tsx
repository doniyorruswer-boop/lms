// O'qituvchi kurs tafsiloti sahifasi (Req 10.2, 10.3, 10.4, 10.5).
//
// Tanlangan kurs uchun darslar, materiallar, baholashlar va talabalar
// ro'yxatini tab (Tabs) ko'rinishida ko'rsatadi. Darslar tabida "Yangi dars"
// (Req 10.3), baholashlar tabida "Yangi baholash" (Req 10.4) formalari
// joylashadi; har bir baholash uchun ishlarni baholash sahifasiga havola
// (Req 10.5) mavjud. Ma'lumot yuklanayotganda skeleton, xatoda esa "Qayta
// urinish" tugmasi ko'rsatiladi.

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
  useTeacherCourseDetail,
  type TeacherCourseDetailData,
} from '../api/use-teacher-course-detail'
import { NewAssessmentForm } from './new-assessment-form'
import { NewLessonForm } from './new-lesson-form'

/** Yuklanish skeletoni (Req 10.2). */
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

/** Backend xatosida xato holati va "Qayta urinish" (Req 10.2). */
function DetailError({ onRetry }: DetailErrorProps) {
  const { t } = useTranslation()
  return (
    <Card role="alert" className="border-destructive">
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <AlertCircle className="size-5 text-destructive" aria-hidden="true" />
        <CardTitle className="text-lg text-destructive">
          {t('teacher.courseDetail.errorTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t('teacher.courseDetail.errorDescription')}
        </p>
        <Button onClick={onRetry} variant="outline">
          {t('teacher.courseDetail.retry')}
        </Button>
      </CardContent>
    </Card>
  )
}

/** Bo'sh tab uchun qator. */
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
  courseId: string
  data: TeacherCourseDetailData
}

/** Kurs tafsiloti tablari: darslar, materiallar, baholashlar, talabalar. */
function DetailTabs({ courseId, data }: DetailTabsProps) {
  const { t } = useTranslation()
  const { lessons, materials, assessments, students } = data

  return (
    <Tabs defaultValue="lessons">
      <TabsList>
        <TabsTrigger value="lessons">
          {t('teacher.courseDetail.tabs.lessons')}
        </TabsTrigger>
        <TabsTrigger value="materials">
          {t('teacher.courseDetail.tabs.materials')}
        </TabsTrigger>
        <TabsTrigger value="assessments">
          {t('teacher.courseDetail.tabs.assessments')}
        </TabsTrigger>
        <TabsTrigger value="students">
          {t('teacher.courseDetail.tabs.students')}
        </TabsTrigger>
      </TabsList>

      {/* Darslar */}
      <TabsContent value="lessons" className="space-y-4">
        <div className="flex justify-end">
          <NewLessonForm courseId={courseId} />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('teacher.courseDetail.lessons.title')}</TableHead>
              <TableHead>{t('teacher.courseDetail.lessons.date')}</TableHead>
              <TableHead className="text-right">
                {t('teacher.courseDetail.lessons.duration')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lessons.length === 0 ? (
              <EmptyRow colSpan={3} label={t('teacher.courseDetail.empty')} />
            ) : (
              lessons.map((lesson) => (
                <TableRow key={lesson.id}>
                  <TableCell className="font-medium">{lesson.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {lesson.date}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {t('teacher.courseDetail.lessons.minutes', {
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
              <TableHead>{t('teacher.courseDetail.materials.title')}</TableHead>
              <TableHead>{t('teacher.courseDetail.materials.type')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.length === 0 ? (
              <EmptyRow colSpan={2} label={t('teacher.courseDetail.empty')} />
            ) : (
              materials.map((material) => (
                <TableRow key={material.id}>
                  <TableCell className="font-medium">
                    <a
                      href={material.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline focus-visible:underline focus-visible:outline-none"
                    >
                      {material.title}
                    </a>
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
      <TabsContent value="assessments" className="space-y-4">
        <div className="flex justify-end">
          <NewAssessmentForm courseId={courseId} />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                {t('teacher.courseDetail.assessments.title')}
              </TableHead>
              <TableHead>
                {t('teacher.courseDetail.assessments.type')}
              </TableHead>
              <TableHead className="text-right">
                {t('teacher.courseDetail.assessments.actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assessments.length === 0 ? (
              <EmptyRow colSpan={3} label={t('teacher.courseDetail.empty')} />
            ) : (
              assessments.map((assessment) => (
                <TableRow key={assessment.id}>
                  <TableCell className="font-medium">
                    {assessment.title}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {t(`student.dashboard.assessmentType.${assessment.type}`)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/teacher/assessments/${assessment.id}/grade`}>
                        {t('teacher.courseDetail.assessments.grade')}
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TabsContent>

      {/* Talabalar */}
      <TabsContent value="students">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('teacher.courseDetail.students.name')}</TableHead>
              <TableHead>
                {t('teacher.courseDetail.students.enrolledAt')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <EmptyRow colSpan={2} label={t('teacher.courseDetail.empty')} />
            ) : (
              students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">
                    {student.fullName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {student.enrolledAt ?? '—'}
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
 * O'qituvchi kurs tafsiloti sahifasining asosiy komponenti. Route paramidan
 * `courseId` ni oladi va yuklanish, xato hamda muvaffaqiyat holatlarini
 * boshqaradi (Req 10.2).
 */
export function TeacherCourseDetail() {
  const { t } = useTranslation()
  const { courseId = '' } = useParams<{ courseId: string }>()
  const { data, isLoading, isError, refetch } = useTeacherCourseDetail(courseId)

  return (
    <main className="space-y-6 p-6" aria-labelledby="teacher-course-detail-title">
      <h1 id="teacher-course-detail-title" className="text-2xl font-bold">
        {t('teacher.courseDetail.title')}
      </h1>

      {isLoading ? (
        <DetailSkeleton />
      ) : isError || !data ? (
        <DetailError onRetry={() => void refetch()} />
      ) : (
        <DetailTabs courseId={courseId} data={data} />
      )}
    </main>
  )
}

export default TeacherCourseDetail
