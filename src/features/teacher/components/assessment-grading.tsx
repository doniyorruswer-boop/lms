// Baholash bo'yicha talaba ishlarini baholash sahifasi (Req 10.5).
//
// Tanlangan baholash (assessment) uchun topshirilgan talaba ishlari jadval
// ko'rinishida ko'rsatiladi. Har bir qator uchun "Baholash"/"Ko'rib chiqish"
// tugmasi (`GradeSubmission` dialogi) mavjud — o'qituvchi ishni ko'radi, ball
// qo'yadi va izoh yozadi. Yuklanish va xato holatlari boshqariladi.

import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
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

import { useSubmissions } from '../api/use-submissions'
import { GradeSubmission } from './grade-submission'

interface GradingErrorProps {
  onRetry: () => void
}

/** Backend xatosida ko'rsatiladigan xato holati va "Qayta urinish". */
function GradingError({ onRetry }: GradingErrorProps) {
  const { t } = useTranslation()
  return (
    <Card role="alert" className="border-destructive">
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <AlertCircle className="size-5 text-destructive" aria-hidden="true" />
        <CardTitle className="text-lg text-destructive">
          {t('teacher.grading.errorTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t('teacher.grading.errorDescription')}
        </p>
        <Button onClick={onRetry} variant="outline">
          {t('teacher.grading.retry')}
        </Button>
      </CardContent>
    </Card>
  )
}

/** Yuklanish skeletoni. */
function GradingSkeleton() {
  const { t } = useTranslation()
  return (
    <div
      className="space-y-3"
      role="status"
      aria-busy="true"
      aria-label={t('common.loading')}
    >
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-12 w-full animate-pulse rounded bg-muted" />
      ))}
    </div>
  )
}

export interface AssessmentGradingProps {
  /** Baholash identifikatori (route paramidan olinmasa to'g'ridan-to'g'ri). */
  assessmentId?: string
}

/**
 * Baholash bo'yicha ishlarni baholash sahifasi (Req 10.5). `assessmentId`
 * prop sifatida yoki route paramidan olinadi.
 */
export function AssessmentGrading({ assessmentId }: AssessmentGradingProps) {
  const { t } = useTranslation()
  const params = useParams<{ assessmentId: string }>()
  const id = assessmentId ?? params.assessmentId ?? ''

  const { data, isLoading, isError, refetch } = useSubmissions(id)

  return (
    <main className="space-y-6 p-6" aria-labelledby="teacher-grading-title">
      <h1 id="teacher-grading-title" className="text-2xl font-bold">
        {t('teacher.grading.pageTitle')}
      </h1>

      {isLoading ? (
        <GradingSkeleton />
      ) : isError || !data ? (
        <GradingError onRetry={() => void refetch()} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('teacher.grading.columns.student')}</TableHead>
              <TableHead>{t('teacher.grading.columns.submittedAt')}</TableHead>
              <TableHead>{t('teacher.grading.columns.score')}</TableHead>
              <TableHead className="text-right">
                {t('teacher.grading.columns.actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground"
                >
                  {t('teacher.grading.empty')}
                </TableCell>
              </TableRow>
            ) : (
              data.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">
                    {submission.studentName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {submission.submittedAt}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {submission.graded
                      ? `${submission.score} / ${submission.maxPoints}`
                      : t('teacher.grading.notGraded')}
                  </TableCell>
                  <TableCell className="text-right">
                    <GradeSubmission submission={submission} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </main>
  )
}

export default AssessmentGrading
