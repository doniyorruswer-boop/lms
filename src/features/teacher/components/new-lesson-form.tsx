// "Yangi dars" yaratish formasi (Req 10.3, 10.6).
//
// Maydonlar: sarlavha, sana, davomiylik (daqiqa), video manbasi (URL yoki
// yuklash) va PDF material havolasi. Forma RHF + Zod (`zodResolver`) bilan
// validatsiya qilinadi; har bir noto'g'ri maydon yonida xato matni ko'rsatiladi
// (Req 10.6). Yuborilganda `useCreateLesson` mutatsiyasi chaqiriladi.
//
// Video uchun ikki rejim: URL kiritish yoki fayl yuklash. Yuklangan fayl
// nomi ko'rsatiladi; haqiqiy yuklash (upload) backend bilan keyinroq
// ulanadi — bu yerda fayl tanlovi mavjudligi ta'minlanadi (Req 10.3).

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
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

import { useCreateLesson } from '../api/use-teacher-mutations'
import { lessonSchema, type LessonFormValues } from '../lib/lesson-schema'

export interface NewLessonFormProps {
  /** Dars qaysi kursga qo'shilishi. */
  courseId: string
}

const DEFAULT_VALUES: LessonFormValues = {
  title: '',
  date: '',
  durationMin: 0,
  videoUrl: '',
  pdfUrl: '',
}

/**
 * "Yangi dars" formasi dialog (modal) ichida. Trigger tugma bosilganda
 * ochiladi; muvaffaqiyatli yuborilgach yopiladi.
 */
export function NewLessonForm({ courseId }: NewLessonFormProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [videoFileName, setVideoFileName] = useState<string | null>(null)
  const createLesson = useCreateLesson(courseId)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LessonFormValues>({
    resolver: zodResolver(lessonSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const onSubmit = handleSubmit((values) => {
    createLesson.mutate(
      {
        title: values.title,
        date: values.date,
        durationMin: values.durationMin,
        videoUrl: values.videoUrl ? values.videoUrl : null,
        pdfUrl: values.pdfUrl ? values.pdfUrl : null,
      },
      {
        onSuccess: () => {
          reset(DEFAULT_VALUES)
          setVideoFileName(null)
          setOpen(false)
        },
      },
    )
  })

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      reset(DEFAULT_VALUES)
      setVideoFileName(null)
      createLesson.reset()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>{t('teacher.lessonForm.new')}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('teacher.lessonForm.title')}</DialogTitle>
          <DialogDescription>
            {t('teacher.lessonForm.description')}
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={onSubmit} className="space-y-4">
          {/* Sarlavha */}
          <div className="space-y-1.5">
            <label htmlFor="lesson-title" className="text-sm font-medium">
              {t('teacher.lessonForm.fields.title')}
            </label>
            <Input
              id="lesson-title"
              type="text"
              aria-invalid={errors.title ? 'true' : undefined}
              aria-describedby={errors.title ? 'lesson-title-error' : undefined}
              {...register('title')}
            />
            {errors.title ? (
              <p
                id="lesson-title-error"
                role="alert"
                className="text-sm text-destructive"
              >
                {t(errors.title.message ?? '')}
              </p>
            ) : null}
          </div>

          {/* Sana */}
          <div className="space-y-1.5">
            <label htmlFor="lesson-date" className="text-sm font-medium">
              {t('teacher.lessonForm.fields.date')}
            </label>
            <Input
              id="lesson-date"
              type="date"
              aria-invalid={errors.date ? 'true' : undefined}
              aria-describedby={errors.date ? 'lesson-date-error' : undefined}
              {...register('date')}
            />
            {errors.date ? (
              <p
                id="lesson-date-error"
                role="alert"
                className="text-sm text-destructive"
              >
                {t(errors.date.message ?? '')}
              </p>
            ) : null}
          </div>

          {/* Davomiylik */}
          <div className="space-y-1.5">
            <label htmlFor="lesson-duration" className="text-sm font-medium">
              {t('teacher.lessonForm.fields.duration')}
            </label>
            <Input
              id="lesson-duration"
              type="number"
              min={1}
              aria-invalid={errors.durationMin ? 'true' : undefined}
              aria-describedby={
                errors.durationMin ? 'lesson-duration-error' : undefined
              }
              {...register('durationMin')}
            />
            {errors.durationMin ? (
              <p
                id="lesson-duration-error"
                role="alert"
                className="text-sm text-destructive"
              >
                {t(errors.durationMin.message ?? '')}
              </p>
            ) : null}
          </div>

          {/* Video URL */}
          <div className="space-y-1.5">
            <label htmlFor="lesson-video-url" className="text-sm font-medium">
              {t('teacher.lessonForm.fields.videoUrl')}
            </label>
            <Input
              id="lesson-video-url"
              type="url"
              placeholder="https://.../stream.m3u8"
              aria-invalid={errors.videoUrl ? 'true' : undefined}
              aria-describedby={
                errors.videoUrl ? 'lesson-video-url-error' : undefined
              }
              {...register('videoUrl')}
            />
            {errors.videoUrl ? (
              <p
                id="lesson-video-url-error"
                role="alert"
                className="text-sm text-destructive"
              >
                {t(errors.videoUrl.message ?? '')}
              </p>
            ) : null}
          </div>

          {/* Video yuklash (alternativ) */}
          <div className="space-y-1.5">
            <label htmlFor="lesson-video-file" className="text-sm font-medium">
              {t('teacher.lessonForm.fields.videoUpload')}
            </label>
            <Input
              id="lesson-video-file"
              type="file"
              accept="video/*"
              onChange={(e) =>
                setVideoFileName(e.target.files?.[0]?.name ?? null)
              }
            />
            {videoFileName ? (
              <p className="text-sm text-muted-foreground">{videoFileName}</p>
            ) : null}
          </div>

          {/* PDF material */}
          <div className="space-y-1.5">
            <label htmlFor="lesson-pdf-url" className="text-sm font-medium">
              {t('teacher.lessonForm.fields.pdfUrl')}
            </label>
            <Input
              id="lesson-pdf-url"
              type="url"
              placeholder="https://.../material.pdf"
              aria-invalid={errors.pdfUrl ? 'true' : undefined}
              aria-describedby={
                errors.pdfUrl ? 'lesson-pdf-url-error' : undefined
              }
              {...register('pdfUrl')}
            />
            {errors.pdfUrl ? (
              <p
                id="lesson-pdf-url-error"
                role="alert"
                className="text-sm text-destructive"
              >
                {t(errors.pdfUrl.message ?? '')}
              </p>
            ) : null}
          </div>

          {createLesson.isError ? (
            <p role="alert" className="text-sm text-destructive">
              {t('teacher.lessonForm.submitError')}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={createLesson.isPending}>
              {t('buttons.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default NewLessonForm
