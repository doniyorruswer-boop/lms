// GradeSubmission uchun unit testlar (Req 10.5).
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { beforeEach, describe, expect, it } from 'vitest'

import i18n from '@/shared/i18n/config'

import { GradeSubmission } from './grade-submission'
import type { Submission } from '../api/types'

const submission: Submission = {
  id: 'sub-1',
  assessmentId: 'a-1',
  studentId: 's-1',
  studentName: 'Ali Valiyev',
  submittedAt: '2024-03-15T09:00:00.000Z',
  answerText: 'Mening javobim matni',
  maxPoints: 10,
  score: null,
  comment: null,
  graded: false,
}

function renderGrade(sub: Submission = submission) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <GradeSubmission submission={sub} />
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

describe('GradeSubmission', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('uz')
  })

  it('ishni ko\'rish, ball va izoh maydonlarini ko\'rsatadi (Req 10.5)', async () => {
    const user = userEvent.setup()
    renderGrade()

    await user.click(screen.getByRole('button', { name: /^baholash$/i }))

    expect(
      await screen.findByText(/mening javobim matni/i),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Ball')).toBeInTheDocument()
    expect(screen.getByLabelText('Izoh')).toBeInTheDocument()
  })

  it('ball maksimal balldan oshsa xato ko\'rsatadi (Req 10.5)', async () => {
    const user = userEvent.setup()
    renderGrade()

    await user.click(screen.getByRole('button', { name: /^baholash$/i }))
    const scoreInput = await screen.findByLabelText('Ball')
    await user.clear(scoreInput)
    await user.type(scoreInput, '15')
    await user.click(screen.getByRole('button', { name: /^saqlash$/i }))

    expect(
      await screen.findByText(/ball 0 dan 10 gacha bo'lishi kerak/i),
    ).toBeInTheDocument()
  })
})
