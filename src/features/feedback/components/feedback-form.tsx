// Shikoyat (feedback) yuborish formasi komponenti (Req 15.1, 15.2).
//
// React Hook Form + feedbackSchema bilan validatsiya qilingan forma.
// Kategoriya, kurs (ixtiyoriy), matn va fayllar maydonlarini o'z ichiga oladi.
// 150-500 belgi chegarasi va majburiy maydonlar validatsiyasi.
// Muvaffaqiyatli yuborilganda shikoyat raqami ko'rsatiladi.

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Loader2, Upload, X, FileText, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'
import { Alert, AlertDescription } from '@/shared/ui/alert'

import { feedbackSchema, type FeedbackFormValues } from '@/shared/lib/validation'
import { useCreateFeedback, convertFormDataToPayload } from '../api/use-feedback-mutations'
import { useStudentCourses } from '@/features/student/api/use-student-courses'

/** Shikoyat turlari - tarjima kalitlari */
const FEEDBACK_CATEGORIES = [
  'teaching_quality',
  'technical_issues', 
  'assessment',
  'course_content',
  'teacher_conduct',
  'system_access',
  'other',
] as const

/** Muvaffaqiyatli yuborilganda ko'rsatiladigan ma'lumot */
interface FeedbackSuccessProps {
  complaintNumber: string
  onReset: () => void
}

function FeedbackSuccess({ complaintNumber, onReset }: FeedbackSuccessProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-green-700 dark:text-green-400">
          {t('feedback.success.title')}
        </CardTitle>
        <CardDescription>
          {t('feedback.success.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription className="font-medium">
            {t('feedback.success.number', { number: complaintNumber })}
          </AlertDescription>
        </Alert>
        
        <p className="text-sm text-muted-foreground">
          {t('feedback.success.next')}
        </p>
        
        <Button onClick={onReset} variant="outline" className="w-full">
          {t('feedback.form.title')}
        </Button>
      </CardContent>
    </Card>
  )
}

export function FeedbackForm() {
  const { t } = useTranslation()
  const createFeedback = useCreateFeedback()
  
  // Student kurslarini yuklash (kurs tanlash uchun)
  const { data: coursesData } = useStudentCourses(1, 100) // Barcha kurslarni olish

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      category: '',
      courseId: undefined,
      text: '',
      attachments: undefined,
    },
  })

  const [submittedComplaint, setSubmittedComplaint] = React.useState<string | null>(null)

  const handleSubmit = async (data: FeedbackFormValues) => {
    try {
      const payload = convertFormDataToPayload(data)
      const response = await createFeedback.mutateAsync(payload)
      
      setSubmittedComplaint(response.complaint.number)
      form.reset()
      
      toast.success(t('feedback.success.title'), {
        description: t('feedback.success.number', { number: response.complaint.number })
      })
    } catch (error) {
      console.error('Failed to submit feedback:', error)
      toast.error(t('feedback.error.submitFailed'), {
        description: t('feedback.error.submitRetry')
      })
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const fileArray = Array.from(files)
      form.setValue('attachments', fileArray)
    }
  }

  const removeFile = (index: number) => {
    const currentFiles = form.getValues('attachments') || []
    const newFiles = currentFiles.filter((_, i) => i !== index)
    form.setValue('attachments', newFiles.length > 0 ? newFiles : undefined)
  }

  // Agar muvaffaqiyatli yuborilgan bo'lsa, success ekranini ko'rsatish
  if (submittedComplaint) {
    return (
      <FeedbackSuccess 
        complaintNumber={submittedComplaint}
        onReset={() => setSubmittedComplaint(null)}
      />
    )
  }

  const isLoading = createFeedback.isPending

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('feedback.form.title')}</CardTitle>
        <CardDescription>
          {t('feedback.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Shikoyat turi */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('feedback.form.category')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('feedback.form.categoryPlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FEEDBACK_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {t(`feedback.categories.${category}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tegishli kurs (ixtiyoriy) */}
            <FormField
              control={form.control}
              name="courseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('feedback.form.course')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('feedback.form.coursePlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {coursesData?.items?.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Shikoyat matni */}
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('feedback.form.text')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('feedback.form.textPlaceholder')}
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Fayllar ilova qilish */}
            <FormField
              control={form.control}
              name="attachments"
              render={() => (
                <FormItem>
                  <FormLabel>{t('feedback.form.attachments')}</FormLabel>
                  <div className="space-y-2">
                    <Input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                      disabled={isLoading}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('feedback.form.attachmentsHint')}
                    </p>
                  </div>
                  
                  {/* Tanlangan fayllar ro'yxati */}
                  {form.watch('attachments')?.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({Math.round(file.size / 1024)}kb)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        disabled={isLoading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Xato xabari */}
            {createFeedback.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('feedback.error.submitFailed')}. {t('feedback.error.submitRetry')}
                </AlertDescription>
              </Alert>
            )}

            {/* Tugmalar */}
            <div className="flex space-x-3">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('feedback.form.submitting')}
                  </>
                ) : (
                  t('feedback.form.submit')
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => form.reset()}
                disabled={isLoading}
              >
                {t('feedback.form.cancel')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}