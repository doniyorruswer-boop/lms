// Shikoyat yuborish formasi (Req 15.1, 15.2, 15.4)
//
// Bu komponent shikoyat kategoriyasi, kurs (ixtiyoriy), matn va fayllar
// biriktirish bilan to'liq shikoyat formasi taqdim etadi. Validatsiya
// react-hook-form + Zod orqali amalga oshiriladi.

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { CheckCircle, FileText, Loader2, Upload, X } from 'lucide-react'

import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/form'
import { Input } from '@/shared/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'

import { useCreateComplaint } from '../api/use-complaints'
import { useStudentCourses } from '@/features/student/api/use-student-courses'
import {
  complaintFormSchema,
  type ComplaintFormData,
  COMPLAINT_CATEGORIES,
  formatFileSize,
  MAX_FILE_SIZE,
  MAX_FILES_COUNT,
} from '../lib/complaint-schema'

interface ComplaintFormProps {
  onSuccess?: (complaintNumber: string) => void
}

/**
 * Muvaffaqiyat dialogini ko'rsatish komponenti (Req 15.2)
 */
interface SuccessDialogProps {
  isOpen: boolean
  complaintNumber: string
  onClose: () => void
}

function SuccessDialog({ isOpen, complaintNumber, onClose }: SuccessDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="size-5 text-green-600" aria-hidden="true" />
            <DialogTitle>{t('complaints.form.success.title')}</DialogTitle>
          </div>
          <DialogDescription>
            {t('complaints.form.success.description')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border bg-green-50 p-4">
            <p className="text-sm font-medium text-green-800">
              {t('complaints.form.success.trackingNumber')}
            </p>
            <p className="text-lg font-mono text-green-900">
              {complaintNumber}
            </p>
          </div>
          <Button onClick={onClose} className="w-full">
            {t('common.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Fayl yuklash komponenti
 */
interface FileUploadProps {
  files: File[]
  onFilesChange: (files: File[]) => void
  error?: string
}

function FileUpload({ files, onFilesChange, error }: FileUploadProps) {
  const { t } = useTranslation()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    const newFiles = [...files, ...selectedFiles].slice(0, MAX_FILES_COUNT)
    onFilesChange(newFiles)
    
    // Input ni tozalash (bir xil faylni qayta tanlash imkoniyati uchun)
    event.target.value = ''
  }

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index)
    onFilesChange(updatedFiles)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Input
          id="file-upload"
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.gif,.pdf,.txt"
          onChange={handleFileSelect}
          className="hidden"
          disabled={files.length >= MAX_FILES_COUNT}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => document.getElementById('file-upload')?.click()}
          disabled={files.length >= MAX_FILES_COUNT}
          className="gap-2"
        >
          <Upload className="size-4" />
          {t('complaints.form.attachments.select')}
        </Button>
        <span className="text-sm text-muted-foreground">
          {files.length}/{MAX_FILES_COUNT}
        </span>
      </div>

      {/* Tanlangan fayllar ro'yxati */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="size-8 p-0"
              >
                <X className="size-4" />
                <span className="sr-only">
                  {t('complaints.form.attachments.remove')}
                </span>
              </Button>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

/**
 * Shikoyat formasi asosiy komponenti (Req 15.1, 15.4)
 */
export function ComplaintForm({ onSuccess }: ComplaintFormProps) {
  const { t } = useTranslation()
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [complaintNumber, setComplaintNumber] = useState('')

  const { mutate: createComplaint, isPending } = useCreateComplaint()
  const { data: coursesData } = useStudentCourses(1, 50) // Get first 50 courses for dropdown
  const courses = coursesData?.items || []

  const form = useForm<ComplaintFormData>({
    resolver: zodResolver(complaintFormSchema),
    defaultValues: {
      category: undefined,
      courseId: null,
      text: '',
      attachments: [],
    },
  })

  const handleSubmit = (data: ComplaintFormData) => {
    createComplaint(
      {
        category: data.category,
        courseId: data.courseId,
        text: data.text,
        attachments: data.attachments,
      },
      {
        onSuccess: (response) => {
          setComplaintNumber(response.number)
          setShowSuccessDialog(true)
          form.reset()
          onSuccess?.(response.number)
        },
      }
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('complaints.form.title')}</CardTitle>
          <CardDescription>
            {t('complaints.form.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Kategoriya tanlash */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('complaints.form.category.label')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t('complaints.form.category.placeholder')}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COMPLAINT_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {t(`complaints.categories.${category}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {t('complaints.form.category.description')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Kurs tanlash (ixtiyoriy) */}
              <FormField
                control={form.control}
                name="courseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('complaints.form.course.label')}</FormLabel>
                    <Select
                      onValueChange={(value: string) =>
                        field.onChange(value === 'none' ? null : value)
                      }
                      value={field.value || 'none'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t('complaints.form.course.placeholder')}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">
                          {t('complaints.form.course.noCourse')}
                        </SelectItem>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {t('complaints.form.course.description')}
                    </FormDescription>
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
                    <FormLabel>{t('complaints.form.text.label')}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={t('complaints.form.text.placeholder')}
                        className="min-h-[120px] resize-none"
                      />
                    </FormControl>
                    <FormDescription>
                      {t('complaints.form.text.description', { minLength: 20 })}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Fayllar biriktirish */}
              <FormField
                control={form.control}
                name="attachments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('complaints.form.attachments.label')}</FormLabel>
                    <FormControl>
                      <FileUpload
                        files={field.value || []}
                        onFilesChange={field.onChange}
                        error={form.formState.errors.attachments?.message}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('complaints.form.attachments.description', {
                        maxSize: formatFileSize(MAX_FILE_SIZE),
                        maxCount: MAX_FILES_COUNT,
                      })}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Yuborish tugmasi */}
              <div className="flex justify-end">
                <Button type="submit" disabled={isPending} className="gap-2">
                  {isPending && <Loader2 className="size-4 animate-spin" />}
                  {t('complaints.form.submit')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Muvaffaqiyat dialogi */}
      <SuccessDialog
        isOpen={showSuccessDialog}
        complaintNumber={complaintNumber}
        onClose={() => setShowSuccessDialog(false)}
      />
    </>
  )
}

export default ComplaintForm