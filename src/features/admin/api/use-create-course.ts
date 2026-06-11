// Yangi kurs yaratish mutatsiyasi (Req 11.3).
//
// Forma `courseSchema` orqali validatsiya qilingan qiymatlarni backendga
// yuboradi. Muvaffaqiyatda kurslar ro'yxati keshini bekor qiladi (invalidate),
// shunda yangi kurs ro'yxatda darhol ko'rinadi.

import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query'

import { apiClient } from '@/shared/api/client'
import { endpoints } from '@/shared/api/endpoints'
import type { CourseFormValues } from '@/shared/lib/validation'
import type { Course } from '@/shared/types'

async function createCourse(values: CourseFormValues): Promise<Course> {
  const res = await apiClient.post<Course>(endpoints.courses.create, values)
  return res.data
}

/**
 * Kurs yaratish mutatsiyasini qaytaradi (Req 11.3).
 *
 * Muvaffaqiyatdan so'ng `['admin', 'courses', ...]` keshlari bekor qilinadi.
 */
export function useCreateCourse(): UseMutationResult<
  Course,
  unknown,
  CourseFormValues
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] })
    },
  })
}
