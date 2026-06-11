// Test_Module server-state qatlami — React Query 5 (Req 7.1, 7.4, 7.5, 7.6).
//
// Test boshlanganda backenddan savollar, taymer (daqiqalarda) va proktoring
// sozlamalari olinadi (Req 7.1). Javoblar `assessments.answers` ga avtosaqlash
// orqali yuboriladi (Req 7.4) va test yakunlanganda `assessments.submit` ga
// yuboriladi (Req 7.5/7.6). Bu modul ATAYLAB faqat tarmoq bilan ishlashga
// e'tibor qaratadi — taymer, debounce avtosaqlash va replay queue mantiqlari
// `TestSession` komponentida ulanadi.

import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'

import { apiClient } from '@/shared/api/client'
import { endpoints } from '@/shared/api/endpoints'
import type { AnswerDraft, Assessment } from '@/shared/types'

/**
 * Test sessiyasining boshlang'ich holati: baholash (savollar, taymer,
 * proktoring) va sessiya boshlangan vaqt (epoch ms). `startedAt` taymerni
 * `computeRemainingMs` orqali hisoblash uchun ishlatiladi (Req 7.2).
 */
export interface TestSession {
  /** Baholash — savollar, `timerMinutes`, `proctoringRequired` (Req 7.1). */
  assessment: Assessment
  /** Sessiya boshlangan epoch millisekund (taymer uchun). */
  startedAt: number
}

/** React Query kesh kaliti — test sessiyasi. */
export function testSessionQueryKey(assessmentId: string) {
  return ['test-session', assessmentId] as const
}

/**
 * Test sessiyasini boshlaydi va savollar/taymer/proktoring sozlamalarini
 * oladi (Req 7.1). Backend `POST /assessments/:id/start` mavjud sessiyani
 * qaytaradi yoki yangisini boshlaydi.
 */
async function startTestSession(assessmentId: string): Promise<TestSession> {
  const res = await apiClient.post<TestSession>(
    endpoints.assessments.start(assessmentId),
  )
  return res.data
}

/**
 * Test sessiyasini yuklaydigan/boshlaydigan React Query hooki.
 *
 * `isLoading` yuklash indikatori uchun, `isError` + `refetch` xato holati va
 * "Qayta urinish" uchun ishlatiladi. `retry: false` — testni boshlash
 * takroriy chaqiriqsiz aniq bo'lishi uchun.
 */
export function useTestSession(
  assessmentId: string,
): UseQueryResult<TestSession> {
  return useQuery({
    queryKey: testSessionQueryKey(assessmentId),
    queryFn: () => startTestSession(assessmentId),
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  })
}

/** Avtosaqlash so'rovi tanasi — bir nechta javob bir batch da yuboriladi. */
export interface SaveAnswersPayload {
  answers: AnswerDraft[]
}

/**
 * Javoblarni backendga yuboradi (Req 7.4). `ReplayQueue` ning `AnswerSender`
 * shartnomasiga mos keladi: muvaffaqiyatda resolve, tarmoq xatosida reject.
 */
export async function saveAnswers(
  assessmentId: string,
  answers: AnswerDraft[],
): Promise<void> {
  await apiClient.post(endpoints.assessments.answers(assessmentId), {
    answers,
  } satisfies SaveAnswersPayload)
}

/**
 * Testni yakuniy yuboradi (Req 7.5/7.6). Avval saqlanmagan javoblar yuborilib,
 * so'ng `submit` chaqiriladi.
 */
export function useSubmitTest(
  assessmentId: string,
): UseMutationResult<void, unknown, void> {
  return useMutation({
    mutationFn: async () => {
      await apiClient.post(endpoints.assessments.submit(assessmentId))
    },
  })
}
