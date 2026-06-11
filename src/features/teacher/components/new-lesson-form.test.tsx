// NewLessonForm uchun unit testlar (Req 10.3, 10.6).
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { beforeEach, describe, expect, it } from 'vitest'

import i18n from '@/shared/i18n/config'

import { NewLessonForm } from './new-lesson-form'

function renderForm() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <NewLessonForm courseId="c-1" />
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

describe('NewLessonForm', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('uz')
  })

  it('dialog ochilganda dars maydonlarini ko\'rsatadi (Req 10.3)', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: /yangi dars/i }))

    expect(
      await screen.findByLabelText('Sarlavha'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Sana')).toBeInTheDocument()
    expect(screen.getByLabelText(/davomiyligi/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/video manbasi/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/pdf material/i)).toBeInTheDocument()
  })

  it('bo\'sh majburiy maydonlarda xato matnlarini ko\'rsatadi (Req 10.6)', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: /yangi dars/i }))
    await user.click(screen.getByRole('button', { name: /^saqlash$/i }))

    expect(await screen.findByText(/sarlavha majburiy/i)).toBeInTheDocument()
    expect(screen.getByText(/sana majburiy/i)).toBeInTheDocument()
  })
})
