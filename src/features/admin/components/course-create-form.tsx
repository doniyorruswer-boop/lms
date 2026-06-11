// Kurs yaratish formasi va kontingent (sig'im) validatsiyasi (Req 11.3–11.6).
//
// Forma `courseSchema` (shared/lib/validation.ts) orqali React Hook Form +
// Zod resolver bilan validatsiya qilinadi. Tanlangan ta'lim yo'nalishiga qarab
// sig'im maydoni ostida vizual indikator ko'rsatiladi (BACHELOR ≤ 300,
// MASTER ≤ 30 — 559-son qaror, 20-band). Chegaradan oshganda forma yuborish
// bloklanadi va 559-son qarorning 20-bandiga havola bilan tushuntirish
// ko'rsatiladi.

import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import {
  courseSchema,
  RESOLUTION_559_CLAUSE_20_URL,
  type CourseFormValues,
} from '@/shared/lib/validation'
import type { DirectionType } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'

import { capacityStatus, type CapacityLevel } from '../lib/capacity'

/** 559-son qaror, 20-band matni uchun rasmiy havola (shared/lib/validation dan). */
export { RESOLUTION_559_CLAUSE_20_URL }

const DIRECTIONS: DirectionType[] = ['BACHELOR', 'MASTER']

/** Indikator darajasiga mos rang sinflari. */
const LEVEL_BAR_CLASS: Record<CapacityLevel, string> = {
  ok: 'bg-primary',
  warning: 'bg-yellow-500',
  exceeded: 'bg-destructive',
}

export interface CourseCreateFormProps {
  /** Forma muvaffaqiyatli validatsiyadan o'tganda chaqiriladi. */
  onSubmit: (values: CourseFormValues) => void | Promise<void>
  /** Yuborish jarayoni davom etayotganini bildiradi (tugmani bloklaydi). */
  isSubmitting?: boolean
}

/**
 * Kurs yaratish formasi. Kontingent chegarasi `courseSchema` da tekshiriladi;
 * chegara oshsa forma yuborilmaydi va 20-bandga havola ko'rsatiladi.
 */
export function CourseCreateForm({
  onSubmit,
  isSubmitting = false,
}: CourseCreateFormProps) {
  const { t } = useTranslation()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
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
  const capacity =
    typeof capacityValue === 'number' && Number.isFinite(capacityValue)
      ? capacityValue
      : 0

  const status = capacityStatus(direction, capacity)
  const barWidth = Math.min(Math.max(status.ratio, 0), 1) * 100

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle className="text-xl">{t('admin.courseForm.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          noValidate
          className="space-y-5"
          onSubmit={(e) => void handleSubmit(onSubmit)(e)}
        >
          {/* Kurs nomi */}
          <div className="space-y-1.5">
            <label htmlFor="course-title" className="text-sm font-medium">
              {t('admin.courseForm.fields.title')}
            </label>
            <Input
              id="course-title"
              {...register('title')}
              aria-invalid={errors.title ? 'true' : 'false'}
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
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {DIRECTIONS.map((dir) => (
                <option key={dir} value={dir}>
                  {t(`admin.directions.${dir}`)}
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
              aria-invalid={errors.semester ? 'true' : 'false'}
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
              aria-invalid={errors.teacherName ? 'true' : 'false'}
            />
            {errors.teacherName && (
              <p className="text-sm text-destructive" role="alert">
                {errors.teacherName.message}
              </p>
            )}
          </div>

          {/* Sig'im + vizual indikator (Req 11.4, 11.5) */}
          <div className="space-y-1.5">
            <label htmlFor="course-capacity" className="text-sm font-medium">
              {t('admin.courseForm.fields.capacity')}
            </label>
            <Input
              id="course-capacity"
              type="number"
              min={1}
              {...register('capacity', { valueAsNumber: true })}
              aria-invalid={errors.capacity ? 'true' : 'false'}
              aria-describedby="capacity-indicator"
            />

            {/* Kontingent indikatori */}
            <div id="capacity-indicator" className="space-y-1">
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={status.limit}
                aria-valuenow={Math.min(capacity, status.limit)}
                aria-label={t('admin.courseForm.capacityIndicator')}
              >
                <div
                  className={`h-full rounded-full transition-all ${LEVEL_BAR_CLASS[status.level]}`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <p
                className={
                  status.exceeded
                    ? 'text-sm font-medium text-destructive'
                    : 'text-sm text-muted-foreground'
                }
                aria-live="polite"
              >
                {t('admin.courseForm.capacityOf', {
                  capacity: Math.max(capacity, 0),
                  limit: status.limit,
                })}
              </p>
            </div>

            {/* Chegara oshganda xato + 20-bandga havola (Req 11.6) */}
            {errors.capacity && (
              <div className="space-y-1" role="alert">
                <p className="text-sm text-destructive">
                  {errors.capacity.message}
                </p>
                <a
                  href={RESOLUTION_559_CLAUSE_20_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary underline underline-offset-4"
                >
                  {t('admin.courseForm.resolutionLink')}
                </a>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || status.exceeded}
            aria-disabled={isSubmitting || status.exceeded}
          >
            {t('buttons.create')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default CourseCreateForm
