// O'qituvchi paneli — dars bo'yicha davomat ko'rinishi (Req 9.5).
//
// Kursning har bir darsi uchun darsga kirgan talabalar ro'yxatini va ularning
// kirish/chiqish vaqtlarini ko'rsatadi. Har bir dars alohida sarlavha va jadval
// bilan ifodalanadi. Yuklanish, xato va bo'sh holatlar boshqariladi.

import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'

import {
  useCourseAttendance,
  type LessonAttendance,
} from '../api/use-course-attendance'
import { formatClockTime, formatDate } from '../lib/format-time'

interface LessonAttendanceTableProps {
  lesson: LessonAttendance
}

/** Bitta dars uchun darsga kirgan talabalar jadvali (toza komponent). */
export function LessonAttendanceTable({ lesson }: LessonAttendanceTableProps) {
  const { t } = useTranslation()

  return (
    <article className="space-y-2">
      <h3 className="text-base font-medium">
        {lesson.lessonTitle}{' '}
        <span className="text-sm font-normal text-muted-foreground">
          ({formatDate(lesson.date)})
        </span>
      </h3>

      {lesson.students.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t('attendance.course.noStudents')}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('attendance.course.student')}</TableHead>
              <TableHead>{t('attendance.course.checkIn')}</TableHead>
              <TableHead>{t('attendance.course.checkOut')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lesson.students.map((student) => (
              <TableRow key={student.studentId}>
                <TableCell>{student.studentName}</TableCell>
                <TableCell className="tabular-nums">
                  {formatClockTime(student.checkInAt)}
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatClockTime(student.checkOutAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </article>
  )
}

/** Yuklanish paytidagi skeleton. */
function CourseAttendanceSkeleton() {
  const { t } = useTranslation()
  return (
    <div
      className="space-y-2"
      role="status"
      aria-busy="true"
      aria-label={t('common.loading')}
    >
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-16 w-full animate-pulse rounded bg-muted" />
      ))}
    </div>
  )
}

export interface CourseAttendanceProps {
  /** O'qituvchi tanlagan kurs identifikatori. */
  courseId: string
}

/**
 * O'qituvchi paneli uchun kurs bo'yicha dars-darsga davomatni yuklab
 * ko'rsatadigan asosiy komponent (Req 9.5).
 */
export function CourseAttendance({ courseId }: CourseAttendanceProps) {
  const { t } = useTranslation()
  const { data, isLoading, isError, refetch } = useCourseAttendance(courseId)

  return (
    <section className="space-y-4" aria-labelledby="course-attendance-title">
      <h2 id="course-attendance-title" className="text-xl font-semibold">
        {t('attendance.course.title')}
      </h2>

      {isLoading ? (
        <CourseAttendanceSkeleton />
      ) : isError || !data ? (
        <div role="alert" className="space-y-3">
          <p className="text-sm text-destructive">
            {t('attendance.course.error')}
          </p>
          <Button variant="outline" onClick={() => void refetch()}>
            {t('attendance.course.retry')}
          </Button>
        </div>
      ) : data.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t('attendance.course.empty')}
        </p>
      ) : (
        <div className="space-y-6">
          {data.map((lesson) => (
            <LessonAttendanceTable key={lesson.lessonId} lesson={lesson} />
          ))}
        </div>
      )}
    </section>
  )
}

export default CourseAttendance
