// Test_Module — test topshirish UI (Req 7.1–7.7).
//
// Ushbu komponent toza logika kutubxonalarini UI bilan ulaydi:
// - `computeRemainingMs` (lib/timer.ts) — orqaga sanovchi taymer (Req 7.2) va
//   0 ga yetganda avtomatik yakunlash (Req 7.5).
// - `debounce` (shared/lib/debounce.ts) — javoblarni 5s tinch davrdan keyin
//   avtosaqlash (Req 7.4).
// - `ReplayQueue` (lib/replay-queue.ts) — ulanish uzilganda saqlanmagan
//   javoblarni buferlash va tiklanganda qayta yuborish (Req 7.7).
//
// Savollar/taymer/proktoring sozlamalari `useTestSession` orqali olinadi
// (Req 7.1). Qo'lda yakunlashda tasdiqlash dialogi ko'rsatiladi (Req 7.6).

import { AlertCircle, Clock, Flag, WifiOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { cn } from '@/shared/lib/utils'
import { debounce, type Debounced } from '@/shared/lib/debounce'
import type { AnswerDraft } from '@/shared/types'

import { computeRemainingMs } from '../lib/timer'
import { ReplayQueue } from '../lib/replay-queue'
import {
  saveAnswers,
  useSubmitTest,
  useTestSession,
  type TestSession as TestSessionData,
} from '../api/use-test-session'

/** Javob avtosaqlash debounce davri (Req 7.4): 5 soniya. */
export const AUTOSAVE_DEBOUNCE_MS = 5_000

/** Millisekundni `mm:ss` (yoki `h:mm:ss`) ko'rinishida formatlaydi. */
function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const seconds = totalSeconds % 60
  const minutes = Math.floor(totalSeconds / 60) % 60
  const hours = Math.floor(totalSeconds / 3600)
  const ss = seconds.toString().padStart(2, '0')
  const mm = minutes.toString().padStart(2, '0')
  if (hours > 0) {
    return `${hours}:${mm}:${ss}`
  }
  return `${mm}:${ss}`
}

interface TestRunnerProps {
  assessmentId: string
  session: TestSessionData
  /** Test muvaffaqiyatli yakunlanganda chaqiriladi. */
  onCompleted?: () => void
}

/**
 * Faol test sessiyasini boshqaruvchi ichki komponent. Sessiya ma'lumotlari
 * yuklanganidan keyin renderlanadi, shunda taymer/autosave hooklari faqat
 * mavjud savollar ustida ishlaydi.
 */
function TestRunner({ assessmentId, session, onCompleted }: TestRunnerProps) {
  const { t } = useTranslation()
  const { assessment, startedAt } = session
  const questions = assessment.questions
  const durationMin = assessment.timerMinutes

  const submitMutation = useSubmitTest(assessmentId)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, AnswerDraft>>({})
  const [remainingMs, setRemainingMs] = useState(() =>
    computeRemainingMs(startedAt, durationMin, Date.now()),
  )
  const [showFinishDialog, setShowFinishDialog] = useState(false)
  const [isConnectionLost, setIsConnectionLost] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  // Saqlanmagan javoblar buferi (Req 7.7). Komponent umri davomida barqaror.
  const replayQueueRef = useRef<ReplayQueue | null>(null)
  if (replayQueueRef.current === null) {
    replayQueueRef.current = new ReplayQueue()
  }

  // Ikki marta yuborishni oldini olish uchun guard (taymer + qo'lda yakunlash).
  const submittedRef = useRef(false)

  // Navbatni backendga yuborishga urinadi. Muvaffaqiyatda ulanish-uzilgan
  // holatini tozalaydi, aks holda uni yoqadi (Req 7.7).
  const flushRef = useRef<() => Promise<boolean>>(async () => true)
  flushRef.current = async () => {
    const ok = await replayQueueRef.current!.flush((batch) =>
      saveAnswers(assessmentId, batch),
    )
    setIsConnectionLost(!ok)
    return ok
  }

  // 5s debounce bilan avtosaqlash (Req 7.4). Barqaror bo'lishi uchun ref da
  // bir marta yaratiladi.
  const debouncedSaveRef = useRef<Debounced<[]> | null>(null)
  if (debouncedSaveRef.current === null) {
    debouncedSaveRef.current = debounce(() => {
      void flushRef.current()
    }, AUTOSAVE_DEBOUNCE_MS)
  }

  // Yakuniy yuborish (Req 7.5 avtomatik, Req 7.6 qo'lda). Taymer effekti undan
  // foydalanishi uchun ref da saqlanadi.
  const performSubmitRef = useRef<() => Promise<void>>(async () => {})
  performSubmitRef.current = async () => {
    if (submittedRef.current) {
      return
    }
    submittedRef.current = true
    setHasSubmitted(true)
    // Kutilayotgan debounce ni bekor qilib, navbatni darhol yuboramiz.
    debouncedSaveRef.current?.cancel()
    await flushRef.current()
    try {
      await submitMutation.mutateAsync()
      onCompleted?.()
    } catch {
      // Yuborish muvaffaqiyatsiz — qayta urinishga ruxsat beramiz.
      submittedRef.current = false
      setHasSubmitted(false)
      setIsConnectionLost(true)
    }
  }

  // Orqaga sanovchi taymer (Req 7.2). Har soniyada qoldiq vaqt qayta
  // hisoblanadi; 0 ga yetganda avtomatik yakunlanadi (Req 7.5).
  useEffect(() => {
    const tick = () => {
      const remaining = computeRemainingMs(startedAt, durationMin, Date.now())
      setRemainingMs(remaining)
      if (remaining === 0) {
        void performSubmitRef.current()
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startedAt, durationMin])

  // Ulanish hodisalari (Req 7.7): uzilganda xato xabarini ko'rsatamiz,
  // tiklanganda saqlanmagan javoblarni qayta yuborishga urinamiz.
  useEffect(() => {
    const handleOffline = () => setIsConnectionLost(true)
    const handleOnline = () => {
      void flushRef.current()
    }
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  // Unmount da kutilayotgan avtosaqlashni bekor qilamiz.
  useEffect(() => {
    return () => {
      debouncedSaveRef.current?.cancel()
    }
  }, [])

  /** Javobni yangilab, navbatga qo'yadi va avtosaqlashni rejalashtiradi. */
  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers((prev) => {
      const existing = prev[questionId]
      const draft: AnswerDraft = {
        questionId,
        selectedOptionId: optionId,
        markedForReview: existing?.markedForReview ?? false,
      }
      replayQueueRef.current!.enqueue(draft)
      return { ...prev, [questionId]: draft }
    })
    debouncedSaveRef.current?.()
  }

  /** "Ko'rib chiqish" belgisini almashtiradi (Req 7.3). */
  const handleToggleReview = (questionId: string) => {
    setAnswers((prev) => {
      const existing = prev[questionId]
      const draft: AnswerDraft = {
        questionId,
        selectedOptionId: existing?.selectedOptionId ?? null,
        markedForReview: !(existing?.markedForReview ?? false),
      }
      replayQueueRef.current!.enqueue(draft)
      return { ...prev, [questionId]: draft }
    })
    debouncedSaveRef.current?.()
  }

  const answeredCount = Object.values(answers).filter(
    (a) => a.selectedOptionId !== null,
  ).length
  const totalQuestions = questions.length
  const progressPct =
    totalQuestions === 0
      ? 0
      : Math.round((answeredCount / totalQuestions) * 100)

  const currentQuestion = questions[currentIndex]

  // Yakuniy holat — test yuborilgan.
  if (hasSubmitted && submitMutation.isSuccess) {
    return (
      <main className="mx-auto max-w-2xl space-y-4 p-6 text-center">
        <h1 className="text-2xl font-bold">{t('test.submittedTitle')}</h1>
        <p className="text-muted-foreground">
          {t('test.submittedDescription')}
        </p>
      </main>
    )
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-4 p-4 md:p-6">
      {/* Yuqori panel: orqaga sanovchi taymer + progress bar (Req 7.2). */}
      <header className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="truncate text-lg font-semibold">{assessment.title}</h1>
          <div
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-1 font-mono text-lg tabular-nums',
              remainingMs <= 60_000
                ? 'bg-destructive/10 text-destructive'
                : 'bg-muted text-foreground',
            )}
            role="timer"
            aria-live="off"
            aria-label={t('test.timeRemaining')}
          >
            <Clock className="size-5" aria-hidden="true" />
            <span>{formatRemaining(remainingMs)}</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {t('test.answeredProgress', {
                answered: answeredCount,
                total: totalQuestions,
              })}
            </span>
            <span>{progressPct}%</span>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={answeredCount}
            aria-valuemin={0}
            aria-valuemax={totalQuestions}
            aria-label={t('test.progressLabel')}
          >
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </header>

      {/* Ulanish uzilgani haqida xato xabari (Req 7.7). */}
      {isConnectionLost && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
        >
          <span className="flex items-center gap-2">
            <WifiOff className="size-4 shrink-0" aria-hidden="true" />
            {t('test.connectionLost')}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void flushRef.current()}
          >
            {t('test.resend')}
          </Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-[1fr_240px]">
        {/* Joriy savol va variantlar. */}
        <section
          className="space-y-4 rounded-lg border border-border bg-card p-4"
          aria-label={t('test.currentQuestion')}
        >
          {currentQuestion ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base font-medium">
                  {t('test.questionNumber', { number: currentIndex + 1 })}
                </h2>
                <Button
                  type="button"
                  variant={
                    answers[currentQuestion.id]?.markedForReview
                      ? 'default'
                      : 'outline'
                  }
                  size="sm"
                  onClick={() => handleToggleReview(currentQuestion.id)}
                  aria-pressed={
                    answers[currentQuestion.id]?.markedForReview ?? false
                  }
                >
                  <Flag className="size-4" aria-hidden="true" />
                  {answers[currentQuestion.id]?.markedForReview
                    ? t('test.marked')
                    : t('test.markForReview')}
                </Button>
              </div>

              <p className="text-sm">{currentQuestion.text}</p>

              <fieldset className="space-y-2">
                <legend className="sr-only">
                  {t('test.questionNumber', { number: currentIndex + 1 })}
                </legend>
                {currentQuestion.options.map((option) => {
                  const selected =
                    answers[currentQuestion.id]?.selectedOptionId === option.id
                  return (
                    <label
                      key={option.id}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm transition-colors',
                        selected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted',
                      )}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        value={option.id}
                        checked={selected}
                        onChange={() =>
                          handleSelectOption(currentQuestion.id, option.id)
                        }
                        className="size-4 accent-primary"
                      />
                      <span>{option.text}</span>
                    </label>
                  )
                })}
              </fieldset>

              {/* Savollararo navigatsiya (Req 7.3). */}
              <div className="flex items-center justify-between gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setCurrentIndex((i) => Math.max(0, i - 1))
                  }
                  disabled={currentIndex === 0}
                >
                  {t('test.previous')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setCurrentIndex((i) =>
                      Math.min(totalQuestions - 1, i + 1),
                    )
                  }
                  disabled={currentIndex >= totalQuestions - 1}
                >
                  {t('test.next')}
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t('test.noQuestions')}
            </p>
          )}
        </section>

        {/* Savollar paneli — navigatsiya va holat ko'rsatkichlari (Req 7.3). */}
        <aside
          className="space-y-3 rounded-lg border border-border bg-card p-4"
          aria-label={t('test.questionPanel')}
        >
          <h2 className="text-sm font-medium">{t('test.questionPanel')}</h2>
          <ul className="grid grid-cols-5 gap-2">
            {questions.map((question, index) => {
              const answer = answers[question.id]
              const isAnswered = !!answer && answer.selectedOptionId !== null
              const isMarked = !!answer && answer.markedForReview
              const isCurrent = index === currentIndex
              return (
                <li key={question.id}>
                  <button
                    type="button"
                    onClick={() => setCurrentIndex(index)}
                    aria-current={isCurrent ? 'true' : undefined}
                    aria-label={t('test.goToQuestion', { number: index + 1 })}
                    className={cn(
                      'relative flex size-9 items-center justify-center rounded-md border text-sm font-medium transition-colors',
                      isCurrent && 'ring-2 ring-primary ring-offset-1',
                      isAnswered
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background hover:bg-muted',
                    )}
                  >
                    {index + 1}
                    {isMarked && (
                      <Flag
                        className="absolute -right-1 -top-1 size-3 text-amber-500"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>

          <Button
            type="button"
            className="w-full"
            onClick={() => setShowFinishDialog(true)}
            disabled={hasSubmitted}
          >
            {t('test.finish')}
          </Button>
        </aside>
      </div>

      {/* Qo'lda yakunlashda tasdiqlash dialogi (Req 7.6). */}
      <Dialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('test.finishConfirmTitle')}</DialogTitle>
            <DialogDescription>
              {t('test.finishConfirmDescription', {
                answered: answeredCount,
                total: totalQuestions,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFinishDialog(false)}
            >
              {t('test.cancel')}
            </Button>
            <Button
              type="button"
              onClick={() => {
                setShowFinishDialog(false)
                void performSubmitRef.current()
              }}
              disabled={submitMutation.isPending}
            >
              {t('test.confirmFinish')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}

export interface TestSessionProps {
  /** Topshirilayotgan baholash identifikatori. */
  assessmentId: string
  /** Test yakunlanganda chaqiriladigan callback. */
  onCompleted?: () => void
}

/**
 * Test_Module ning asosiy kirish komponenti. Sessiyani yuklaydi (Req 7.1),
 * yuklash/xato holatlarini boshqaradi va tayyor bo'lganda `TestRunner` ni
 * renderlaydi.
 */
export function TestSession({ assessmentId, onCompleted }: TestSessionProps) {
  const { t } = useTranslation()
  const { data, isLoading, isError, refetch } = useTestSession(assessmentId)

  if (isLoading) {
    return (
      <main className="p-6" role="status" aria-busy="true">
        <p className="text-sm text-muted-foreground">{t('test.loading')}</p>
      </main>
    )
  }

  if (isError || !data) {
    return (
      <main className="mx-auto max-w-md p-6" role="alert">
        <div className="space-y-4 rounded-lg border border-destructive p-4 text-center">
          <AlertCircle
            className="mx-auto size-6 text-destructive"
            aria-hidden="true"
          />
          <p className="font-medium text-destructive">
            {t('test.errorTitle')}
          </p>
          <p className="text-sm text-muted-foreground">
            {t('test.errorDescription')}
          </p>
          <Button variant="outline" onClick={() => void refetch()}>
            {t('test.retry')}
          </Button>
        </div>
      </main>
    )
  }

  return (
    <TestRunner
      assessmentId={assessmentId}
      session={data}
      onCompleted={onCompleted}
    />
  )
}

export default TestSession
