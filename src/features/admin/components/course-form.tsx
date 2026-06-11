// Kurs yaratish formasi va kontingent validatsiyasi (Req 11.3–11.6).
//
// Forma `courseSchema` (Zod) bilan validatsiya qilinadi: yo'nalishga qarab
// sig'im chegarasi (BACHELOR ≤ 300, MASTER ≤ 30) tekshiriladi. Tanlangan
// yo'nalishga mos sig'im indikatori (progress bar) ko'rsatiladi; sig'im
// chegaradan oshib ketsa, yuborish bloklanadi va 559-son qaror, 20-bandiga
// havola bilan tushuntirish ko'rsatiladi.

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { AlertCircle } from 'lucide-react'

import {
  courseSchema,
  RESOLUTION_559_CLAUSE_20_URL,
  type CourseFormValues,
} from '@/shared/lib/validation'
import type { DirectionType } from '@/shared/types'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'

import { useCreateCourse } from '../api/use-create-course'
import { capacityStatus } from '../lib/capacity'

const DIRECTIONS: readonly DirectionType[] = ['BACHELOR', 'MASTER'] as const

interface CourseFormProps {
  /** Kurs muvaffaqiyatli yaratilganda chaqiriladi (mas. formani yopish). */
  onSuccess?: () => void
  /** "Bekor qilish" tugmasi bosilganda chaqiriladi. */
  onCancel?: () => void
}

/**
 * Kurs yaratish formasi (Req 11.3). Kontingent indikatori va validatsiya
 * bloklash (Req 11.4–11.6) bilan jihozlangan.
 */
export function CourseForm({ onSuccess, onCancel }: CourseFormProps) {
  const { t } = useTranslation()
  const createCourse = useCreateCourse()
  const [submitError, setSubmitError] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      direction: 'BACHELOR',
      semester: 1,
      teacherName: '',
      capacity: 1,
    },
  })

  const direction = watch('direction')
  const capacityValue = watch('capacity')
  const status = capacityStatus(direction, Number(capacityValue))

  async function onSubmit(values: CourseFormValues) {
    setSubmitError(false)
    try {
      await createCourse.mutateAsync(values)
      onSuccess?.()
    } catch {
      setSubmitError(true)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t('admin.courseForm.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-5"
        >
          {/* Kurs nomi */}
          <div className="space-y-1.5">
            <label htmlFor="course-title" className="text-sm font-medium">
              {t('admin.courseForm.fields.title')}
            </label>
            <Input
              id="course-title"
              {...register('title')}
              aria-invalid={errors.title ? 'true' : undefined}
            />
            {errors.title && (
              <p className="text-sm text-destructive" role="alert">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Ta'lim yo'nalishi */}
          <div className="space-y-1.5">
            <label htmlFor="course-direction" className="text-sm font-medium">
              {t('admin.courseForm.fields.direction')}
            </label>
            <select
              id="course-direction"
              {...register('direction')}
              className={cn(
                'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              )}
            >
              {DIRECTIONS.map((d) => (
                <option key={d} value={d}>
                  {t(`admin.directions.${d}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Semestr */}
          <div className="space-y-1.5">
            <label htmlFor="course-semester" className="text-sm font-medium">
              {t('admin.courseForm.fields.semester')}
            </label>
            <Input
              id="course-semester"
              type="number"
              min={1}
              {...register('semester', { valueAsNumber: true })}
              aria-invalid={errors.semester ? 'true' : undefined}
            />
            {errors.semester && (
              <p className="text-sm text-destructive" role="alert">
                {errors.semester.message}
              </p>
            )}
          </div>

          {/* O'qituvchi */}
          <div className="space-y-1.5">
            <label htmlFor="course-teacher" className="text-sm font-medium">
              {t('admin.courseForm.fields.teacher')}
            </label>
            <Input
              id="course-teacher"
              {...register('teacherName')}
              aria-invalid={errors.teacherName ? 'true' : undefined}
            />
            {errors.teacherName && (
              <p className="text-sm text-destructive" role="alert">
                {errors.teacherName.message}
              </p>
            )}
          </div>

          {/* Sig'im + kontingent indikatori (Req 11.4, 11.5) */}
          <div className="space-y-1.5">
            <label htmlFor="course-capacity" className="text-sm font-medium">
              {t('admin.courseForm.fields.capacity')}
            </label>
            <Input
              id="course-capacity"
              type="number"
              min={1}
              {...register('capacity', { valueAsNumber: true })}
              aria-invalid={
                errors.capacity || status.exceeded ? 'true' : undefined
              }
              aria-describedby="course-capacity-indicator"
            />

            {/* Vizual indikator: to'ldirilish darajasi (Req 11.4, 11.5) */}
            <div id="course-capacity-indicator" className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t('admin.courseForm.capacityIndicator')}</span>
                <span className="tabular-nums">
                  {t('admin.courseForm.capacityOf', {
                    capacity: Number.isFinite(Number(capacityValue))
                      ? Math.max(0, Number(capacityValue) || 0)
                      : 0,
                    limit: status.limit,
                  })}
                </span>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={status.limit}
                aria-valuenow={Math.max(0, Number(capacityValue) || 0)}
              >
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    status.exceeded ? 'bg-destructive' : 'bg-primary',
                  )}
                  style={{ width: `${status.percent}%` }}
                />
              </div>
            </div>

            {/* Kontingent oshib ketganda xato + 559-son qaror havolasi
                (Req 11.6) */}
            {(errors.capacity || status.exceeded) && (
              <div
                className="flex flex-col gap-1 rounded-md border border-destructive bg-destructive/5 p-3 text-sm text-destructive"
                role="alert"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle
                    className="mt-0.5 size-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span>
                    {errors.capacity?.message ??
                      t('admin.courseForm.resolutionLink')}
                  </span>
                </div>
                <a
                  href={RESOLUTION_559_CLAUSE_20_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-6 font-medium underline underline-offset-4"
                >
                  {t('admin.courseForm.resolutionLinkLabel')}
                </a>
              </div>
            )}
          </div>

          {submitError && (
            <p className="text-sm text-destructive" role="alert">
              {t('admin.courseForm.submitError')}
            </p>
          )}

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={status.exceeded || isSubmitting || createCourse.isPending}
            >
              {t('admin.courseForm.submit')}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                {t('buttons.cancel')}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default CourseForm
