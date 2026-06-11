// O'qituvchi yaratish/baholash mutatsiyalari (Req 10.3, 10.4, 10.5).
//
// - `useCreateLesson(courseId)` — "Yangi dars" formasini backendga yuboradi.
// - `useCreateAssessment()` — "Yangi baholash" formasini backendga yuboradi.
// - `useGradeSubmission(assessmentId)` — talaba ishiga ball va izoh yuboradi.
//
// React Query 5 `useMutation` orqali yuborish holati (`isPending`), xato
// (`isError`) va muvaffaqiyat boshqariladi. Muvaffaqiyatdan keyin tegishli
// query keshlari `invalidate` qilinadi — shunday qilib ro'yxatlar va sanovchi
// (ungraded count) yangilanadi.

import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query'

import { apiClient } from '@/shared/api/client'
import { endpoints } from '@/shared/api/endpoints'
import type { Assessment, Lesson } from '@/shared/types'

import { TEACHER_DASHBOARD_QUERY_KEY } from './use-teacher-dashboard'
import { teacherCourseDetailQueryKey } from './use-teacher-course-detail'
import { submissionsQueryKey } from './use-submissions'
import type { Submission } from './types'

/** "Yangi dars" so'rovi uchun yuk (payload). */
export interface CreateLessonPayload {
  title: string
  /** Dars sanasi (ISO 8601 yoki `date` input qiymati). */
  date: string
  durationMin: number
  /** Video manbasi (URL); bo'lmasa `null`. */
  videoUrl: string | null
  /** PDF material havolasi; bo'lmasa `null`. */
  pdfUrl: string | null
}

/** "Yangi baholash" so'rovi uchun yuk (payload). */
export interface CreateAssessmentPayload {
  courseId: string
  type: 'TEST' | 'ASSIGNMENT'
  title: string
  timerMinutes: number
  proctoringRequired: boolean
  questions: { text: string; points: number }[]
}

/** Baholash so'rovi uchun yuk (payload). */
export interface GradeSubmissionPayload {
  submissionId: string
  score: number
  comment: string | null
}

/**
 * "Yangi dars" yaratish mutatsiyasi (Req 10.3). Muvaffaqiyatdan keyin kurs
 * tafsiloti va dashboard keshlari yangilanadi.
 */
export function useCreateLesson(
  courseId: string,
): UseMutationResult<Lesson, Error, CreateLessonPayload> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateLessonPayload) => {
      const res = await apiClient.post<Lesson>(
        endpoints.lessons.create(courseId),
        payload,
      )
      return res.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: teacherCourseDetailQueryKey(courseId),
      })
      void queryClient.invalidateQueries({
        queryKey: TEACHER_DASHBOARD_QUERY_KEY,
      })
    },
  })
}

/**
 * "Yangi baholash" yaratish mutatsiyasi (Req 10.4). Muvaffaqiyatdan keyin
 * tegishli kurs tafsiloti keshi yangilanadi.
 */
export function useCreateAssessment(): UseMutationResult<
  Assessment,
  Error,
  CreateAssessmentPayload
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateAssessmentPayload) => {
      const res = await apiClient.post<Assessment>(
        endpoints.assessments.create,
        payload,
      )
      return res.data
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: teacherCourseDetailQueryKey(variables.courseId),
      })
    },
  })
}

/**
 * Talaba ishini baholash mutatsiyasi (Req 10.5). Muvaffaqiyatdan keyin
 * ishlar ro'yxati va baholanmagan sanovchi yangilanadi.
 */
export function useGradeSubmission(
  assessmentId: string,
): UseMutationResult<Submission, Error, GradeSubmissionPayload> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ submissionId, score, comment }) => {
      const res = await apiClient.post<Submission>(
        endpoints.assessments.grade(assessmentId, submissionId),
        { score, comment },
      )
      return res.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: submissionsQueryKey(assessmentId),
      })
      void queryClient.invalidateQueries({
        queryKey: TEACHER_DASHBOARD_QUERY_KEY,
      })
    },
  })
}
