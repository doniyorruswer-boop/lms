// AttendanceHistoryTable uchun unit testlar (Req 9.4).
import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { beforeEach, describe, expect, it } from 'vitest'

import i18n from '@/shared/i18n/config'
import type { AttendanceRecord } from '@/shared/types'

import { AttendanceHistoryTable } from './attendance-history'

function renderTable(records: AttendanceRecord[]) {
  return render(
    <I18nextProvider i18n={i18n}>
      <AttendanceHistoryTable records={records} />
    </I18nextProvider>,
  )
}

const records: AttendanceRecord[] = [
  {
    id: 'r-1',
    courseId: 'c-1',
    courseTitle: 'Matematika',
    date: '2024-03-15T00:00:00.000Z',
    checkInAt: '2024-03-15T09:00:00.000Z',
    checkOutAt: '2024-03-15T10:30:00.000Z',
  },
  {
    id: 'r-2',
    courseId: 'c-2',
    courseTitle: 'Fizika',
    date: '2024-03-16T00:00:00.000Z',
    checkInAt: '2024-03-16T11:00:00.000Z',
    checkOutAt: null,
  },
]

describe('AttendanceHistoryTable', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('uz')
  })

  it('har bir yozuv uchun sana, kurs nomi va vaqtlarni ko\'rsatadi (Req 9.4)', () => {
    renderTable(records)

    expect(screen.getByText('Matematika')).toBeInTheDocument()
    expect(screen.getByText('Fizika')).toBeInTheDocument()
    // Ustun sarlavhalari.
    expect(screen.getByRole('columnheader', { name: /sana/i })).toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', { name: /kurs/i }),
    ).toBeInTheDocument()
    // Har bir yozuv bitta qator (+1 sarlavha qatori).
    expect(screen.getAllByRole('row')).toHaveLength(records.length + 1)
  })

  it('chiqish vaqti null bo\'lganda joy belgisini ko\'rsatadi', () => {
    renderTable(records)
    // "Fizika" yozuvida checkOutAt null — joy belgisi (—) ko'rinadi.
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1)
  })

  it('yozuvlar bo\'sh bo\'lganda ma\'lumot yo\'qligi xabarini ko\'rsatadi', () => {
    renderTable([])
    expect(screen.getByText(/davomat yozuvlari yo'q/i)).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
