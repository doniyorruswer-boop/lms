// Talaba ishini baholash komponenti (Req 10.5).
//
// O'qituvchi talaba ishini ko'radi, ball qo'yadi va izoh yozadi. Dialog
// (modal) ichida ishning matni ko'rsatiladi; ball [0, maxPoints] oraliqda
// validatsiya qilinadi (`createGradeSchema`) va izoh ixtiyoriy. Yuborilganda
// `useGradeSubmission` mutatsiyasi chaqiriladi.

import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'

import { useGradeSubmission } from '../api/use-teacher-mutations'
import { createGradeSchema, type GradeFormValues } from '../lib/grade-schema'
import type { Submission } from '../api/types'

export interface GradeSubmissionProps {
  /** Baholanayotgan ish. */
  submission: Submission
}

/**
 * Talaba ishini baholash dialogi. Ishning matni, ball maydoni va izoh
 * maydonini ko'rsatadi (Req 10.5).
 */
export function GradeSubmission({ submission }: GradeSubmissionProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const grade = useGradeSubmission(submission.assessmentId)

  const schema = useMemo(
    () => createGradeSchema(submission.maxPoints),
    [submission.maxPoints],
  )

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GradeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      score: submission.score ?? 0,
      comment: submission.comment ?? '',
    },
  })

  const onSubmit = handleSubmit((values) => {
    grade.mutate(
      {
        submissionId: submission.id,
        score: values.score,
        comment: values.comment ? values.comment : null,
      },
      {
        onSuccess: () => {
          setOpen(false)
        },
      },
    )
  })

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      // Dialog ochilganda joriy qiymatlar bilan formani tiklash.
      reset({
        score: submission.score ?? 0,
        comment: submission.comment ?? '',
      })
    } else {
      grade.reset()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {submission.graded
            ? t('teacher.grading.review')
            : t('teacher.grading.grade')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t('teacher.grading.title', { name: submission.studentName })}
          </DialogTitle>
          <DialogDescription>
            {t('teacher.grading.maxPoints', { points: submission.maxPoints })}
          </DialogDescription>
        </DialogHeader>

        {/* Talaba ishini ko'rish (Req 10.5) */}
        <div className="space-y-1.5">
          <h3 className="text-sm font-medium">{t('teacher.grading.work')}</h3>
          <div className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-3 text-sm">
            {submission.answerText ? (
              submission.answerText
            ) : (
              <span className="text-muted-foreground">
                {t('teacher.grading.noWork')}
              </span>
            )}
          </div>
        </div>

        <form noValidate onSubmit={onSubmit} className="space-y-4">
          {/* Ball */}
          <div className="space-y-1.5">
            <label htmlFor="grade-score" className="text-sm font-medium">
              {t('teacher.grading.fields.score')}
            </label>
            <Input
              id="grade-score"
              type="number"
              min={0}
              max={submission.maxPoints}
              aria-invalid={errors.score ? 'true' : undefined}
              aria-describedby={errors.score ? 'grade-score-error' : undefined}
              {...register('score')}
            />
            {errors.score ? (
              <p
                id="grade-score-error"
                role="alert"
                className="text-sm text-destructive"
              >
                {t(errors.score.message ?? '', { max: submission.maxPoints })}
              </p>
            ) : null}
          </div>

          {/* Izoh */}
          <div className="space-y-1.5">
            <label htmlFor="grade-comment" className="text-sm font-medium">
              {t('teacher.grading.fields.comment')}
            </label>
            <textarea
              id="grade-comment"
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              {...register('comment')}
            />
          </div>

          {grade.isError ? (
            <p role="alert" className="text-sm text-destructive">
              {t('teacher.grading.submitError')}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={grade.isPending}>
              {t('buttons.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default GradeSubmission
