// "Yangi baholash" yaratish formasi (Req 10.4, 10.6).
//
// Maydonlar: baholash turi (test/topshiriq), savollar (matn + ball), taymer
// (daqiqa) va proktoring talab qilinishi. Savollar `useFieldArray` orqali
// dinamik qo'shiladi/o'chiriladi. Forma RHF + Zod (`zodResolver`) bilan
// validatsiya qilinadi; har bir noto'g'ri maydon yonida xato matni ko'rsatiladi
// (Req 10.6). Yuborilganda `useCreateAssessment` mutatsiyasi chaqiriladi.

import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
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

import { useCreateAssessment } from '../api/use-teacher-mutations'
import {
  assessmentSchema,
  type AssessmentFormValues,
} from '../lib/assessment-schema'

export interface NewAssessmentFormProps {
  /** Baholash qaysi kursga qo'shilishi. */
  courseId: string
}

const DEFAULT_VALUES: AssessmentFormValues = {
  title: '',
  type: 'TEST',
  timerMinutes: 30,
  proctoringRequired: false,
  questions: [{ text: '', points: 1 }],
}

/**
 * "Yangi baholash" formasi dialog (modal) ichida. Savollar dinamik
 * boshqariladi (qo'shish/o'chirish).
 */
export function NewAssessmentForm({ courseId }: NewAssessmentFormProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const createAssessment = useCreateAssessment()

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'questions',
  })

  const onSubmit = handleSubmit((values) => {
    createAssessment.mutate(
      {
        courseId,
        type: values.type,
        title: values.title,
        timerMinutes: values.timerMinutes,
        proctoringRequired: values.proctoringRequired,
        questions: values.questions,
      },
      {
        onSuccess: () => {
          reset(DEFAULT_VALUES)
          setOpen(false)
        },
      },
    )
  })

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      reset(DEFAULT_VALUES)
      createAssessment.reset()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>{t('teacher.assessmentForm.new')}</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('teacher.assessmentForm.title')}</DialogTitle>
          <DialogDescription>
            {t('teacher.assessmentForm.description')}
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={onSubmit} className="space-y-4">
          {/* Sarlavha */}
          <div className="space-y-1.5">
            <label htmlFor="assessment-title" className="text-sm font-medium">
              {t('teacher.assessmentForm.fields.title')}
            </label>
            <Input
              id="assessment-title"
              type="text"
              aria-invalid={errors.title ? 'true' : undefined}
              aria-describedby={
                errors.title ? 'assessment-title-error' : undefined
              }
              {...register('title')}
            />
            {errors.title ? (
              <p
                id="assessment-title-error"
                role="alert"
                className="text-sm text-destructive"
              >
                {t(errors.title.message ?? '')}
              </p>
            ) : null}
          </div>

          {/* Tur */}
          <div className="space-y-1.5">
            <label htmlFor="assessment-type" className="text-sm font-medium">
              {t('teacher.assessmentForm.fields.type')}
            </label>
            <select
              id="assessment-type"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              {...register('type')}
            >
              <option value="TEST">
                {t('teacher.assessmentForm.types.TEST')}
              </option>
              <option value="ASSIGNMENT">
                {t('teacher.assessmentForm.types.ASSIGNMENT')}
              </option>
            </select>
          </div>

          {/* Taymer */}
          <div className="space-y-1.5">
            <label htmlFor="assessment-timer" className="text-sm font-medium">
              {t('teacher.assessmentForm.fields.timer')}
            </label>
            <Input
              id="assessment-timer"
              type="number"
              min={1}
              aria-invalid={errors.timerMinutes ? 'true' : undefined}
              aria-describedby={
                errors.timerMinutes ? 'assessment-timer-error' : undefined
              }
              {...register('timerMinutes')}
            />
            {errors.timerMinutes ? (
              <p
                id="assessment-timer-error"
                role="alert"
                className="text-sm text-destructive"
              >
                {t(errors.timerMinutes.message ?? '')}
              </p>
            ) : null}
          </div>

          {/* Proktoring */}
          <div className="flex items-center gap-2">
            <input
              id="assessment-proctoring"
              type="checkbox"
              className="size-4 rounded border-input"
              {...register('proctoringRequired')}
            />
            <label
              htmlFor="assessment-proctoring"
              className="text-sm font-medium"
            >
              {t('teacher.assessmentForm.fields.proctoring')}
            </label>
          </div>

          {/* Savollar */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">
              {t('teacher.assessmentForm.fields.questions')}
            </legend>

            {errors.questions?.message ? (
              <p role="alert" className="text-sm text-destructive">
                {t(errors.questions.message)}
              </p>
            ) : null}

            {fields.map((field, index) => (
              <div
                key={field.id}
                className="space-y-2 rounded-md border border-border p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {t('teacher.assessmentForm.questionNumber', {
                      number: index + 1,
                    })}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    disabled={fields.length <= 1}
                    aria-label={t('teacher.assessmentForm.removeQuestion', {
                      number: index + 1,
                    })}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor={`question-text-${index}`}
                    className="text-sm"
                  >
                    {t('teacher.assessmentForm.fields.questionText')}
                  </label>
                  <Input
                    id={`question-text-${index}`}
                    type="text"
                    aria-invalid={
                      errors.questions?.[index]?.text ? 'true' : undefined
                    }
                    {...register(`questions.${index}.text` as const)}
                  />
                  {errors.questions?.[index]?.text ? (
                    <p role="alert" className="text-sm text-destructive">
                      {t(errors.questions[index]?.text?.message ?? '')}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor={`question-points-${index}`}
                    className="text-sm"
                  >
                    {t('teacher.assessmentForm.fields.points')}
                  </label>
                  <Input
                    id={`question-points-${index}`}
                    type="number"
                    min={1}
                    aria-invalid={
                      errors.questions?.[index]?.points ? 'true' : undefined
                    }
                    {...register(`questions.${index}.points` as const)}
                  />
                  {errors.questions?.[index]?.points ? (
                    <p role="alert" className="text-sm text-destructive">
                      {t(errors.questions[index]?.points?.message ?? '')}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ text: '', points: 1 })}
            >
              {t('teacher.assessmentForm.addQuestion')}
            </Button>
          </fieldset>

          {createAssessment.isError ? (
            <p role="alert" className="text-sm text-destructive">
              {t('teacher.assessmentForm.submitError')}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={createAssessment.isPending}>
              {t('buttons.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default NewAssessmentForm
