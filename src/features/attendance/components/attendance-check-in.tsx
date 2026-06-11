// Check-in/check-out tugmasi komponenti (Req 9.1, 9.2, 9.3).
//
// Tugma holatlari `attendanceTransition` holat-mashinasi orqali boshqariladi:
//   - `idle` → "Darsga kirdim" tugmasi (faqat dars vaqti boshlangach faol, 9.1)
//   - bosilganda kirish vaqti backendga yuboriladi va holat `in` ga o'tadi;
//     tugma "Darsdan chiqdim" ga o'zgaradi (9.2)
//   - `in` → "Darsdan chiqdim"; bosilganda chiqish vaqti yuboriladi va holat
//     `out` ga o'tadi; sessiya yopilgan deb belgilanadi (9.3)
//   - `out` → sessiya yopilgan xabari ko'rsatiladi
//
// Holat faqat backend so'rovi muvaffaqiyatli bo'lgach o'zgaradi — shu sababli
// tarmoq xatosida tugma o'z holatida qoladi va talaba qayta urinishi mumkin.

import { LogIn, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ui/button'

import {
  useCheckIn,
  useCheckOut,
} from '../api/use-attendance-mutations'
import { isLessonStarted } from '../lib/lesson-timing'
import {
  attendanceTransition,
  type AttendanceState,
} from '../lib/state-machine'

export interface AttendanceCheckInProps {
  /** Dars identifikatori. */
  lessonId: string
  /** Dars boshlanish vaqti (ISO 8601) — "Darsga kirdim" faollashuvi uchun. */
  lessonStartAt: string
  /** Boshlang'ich holat (mas. backend allaqachon kirilganini bildirsa). */
  initialState?: AttendanceState
  /** Joriy vaqt (epoch ms). Test/SSR uchun; standart `Date.now()`. */
  now?: number
}

/**
 * Talaba uchun davomat check-in/check-out tugmasi. Holat-mashina
 * (`attendanceTransition`) orqali tugma yozuvi va amallarni boshqaradi.
 */
export function AttendanceCheckIn(props: AttendanceCheckInProps) {
  const { lessonId, lessonStartAt, initialState = 'idle', now } = props
  const { t } = useTranslation()

  const [state, setState] = useState<AttendanceState>(initialState)
  const checkIn = useCheckIn()
  const checkOut = useCheckOut()

  const started = isLessonStarted(lessonStartAt, now ?? Date.now())
  const isPending = checkIn.isPending || checkOut.isPending

  const handleCheckIn = () => {
    const result = attendanceTransition(state, 'check_in')
    if (!result.ok) {
      return
    }
    checkIn.mutate(
      { lessonId, at: new Date().toISOString() },
      { onSuccess: () => setState(result.state) },
    )
  }

  const handleCheckOut = () => {
    const result = attendanceTransition(state, 'check_out')
    if (!result.ok) {
      return
    }
    checkOut.mutate(
      { lessonId, at: new Date().toISOString() },
      { onSuccess: () => setState(result.state) },
    )
  }

  // Sessiya yopilgan (Req 9.3) — boshqa amal yo'q.
  if (state === 'out') {
    return (
      <p role="status" className="text-sm font-medium text-muted-foreground">
        {t('attendance.checkIn.sessionClosed')}
      </p>
    )
  }

  // Kirilgan holat — "Darsdan chiqdim" (Req 9.3).
  if (state === 'in') {
    return (
      <div className="space-y-2">
        <Button
          type="button"
          variant="destructive"
          onClick={handleCheckOut}
          disabled={isPending}
        >
          <LogOut aria-hidden="true" />
          {t('attendance.checkIn.checkOut')}
        </Button>
        {checkOut.isError && (
          <p role="alert" className="text-sm text-destructive">
            {t('attendance.checkIn.error')}
          </p>
        )}
      </div>
    )
  }

  // Boshlang'ich holat — "Darsga kirdim" (Req 9.1, 9.2).
  // Tugma faqat dars vaqti boshlangach faollashadi.
  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={handleCheckIn}
        disabled={!started || isPending}
      >
        <LogIn aria-hidden="true" />
        {t('attendance.checkIn.checkIn')}
      </Button>
      {!started && (
        <p className="text-sm text-muted-foreground">
          {t('attendance.checkIn.notStarted')}
        </p>
      )}
      {checkIn.isError && (
        <p role="alert" className="text-sm text-destructive">
          {t('attendance.checkIn.error')}
        </p>
      )}
    </div>
  )
}

export default AttendanceCheckIn
