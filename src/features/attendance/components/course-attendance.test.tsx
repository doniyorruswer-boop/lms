// LessonAttendanceTable uchun unit testlar (Req 9.5).
import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { beforeEach, describe, expect, it } from 'vitest'

import i18n from '@/shared/i18n/config'

import { LessonAttendanceTable } from './course-attendance'
import type { LessonAttendance } from '../api/use-course-attendance'

function renderLesson(lesson: LessonAttendance) {
  return render(
    <I18nextProvider i18n={i18n}>
      <LessonAttendanceTable lesson={lesson} />
    </I18nextProvider>,
  )
}

const lesson: LessonAttendance = {
  lessonId: 'l-1',
  lessonTitle: '1-dars: Kirish',
  date: '2024-03-15T00:00:00.000Z',
  students: [
    {
      studentId: 's-1',
      studentName: 'Ali Valiyev',
      checkInAt: '2024-03-15T09:00:00.000Z',
      checkOutAt: '2024-03-15T10:30:00.000Z',
    },
    {
      studentId: 's-2',
      studentName: 'Hasan Karimov',
      checkInAt: '2024-03-15T09:05:00.000Z',
      checkOutAt: null,
    },
  ],
}

describe('LessonAttendanceTable', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('uz')
  })

  it('dars sarlavhasi va kirgan talabalarni vaqtlari bilan ko\'rsatadi (Req 9.5)', () => {
    renderLesson(lesson)

    expect(screen.getByText(/1-dars: Kirish/)).toBeInTheDocument()
    expect(screen.getByText('Ali Valiyev')).toBeInTheDocument()
    expect(screen.getByText('Hasan Karimov')).toBeInTheDocument()
    // Ikki talaba + sarlavha qatori.
    expect(screen.getAllByRole('row')).toHaveLength(3)
  })

  it('darsga hech kim kirmaganda tegishli xabarni ko\'rsatadi', () => {
    renderLesson({ ...lesson, students: [] })
    expect(
      screen.getByText(/bu darsga kirgan talabalar yo'q/i),
    ).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
