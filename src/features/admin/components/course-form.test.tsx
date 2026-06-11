// CourseForm uchun unit testlar (Req 11.4, 11.5, 11.6).
//
// Kontingent chegarasidan oshganda yuborish tugmasi bloklanishi va 559-son
// qarorga havola ko'rsatilishini tekshiradi. Backend chaqirilmaydi (yuborish
// bloklangan), shu sababli MSW handler talab qilinmaydi.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { beforeEach, describe, expect, it } from 'vitest'

import i18n from '@/shared/i18n/config'

import { CourseForm } from './course-form'

function renderForm() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <CourseForm />
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

describe('CourseForm', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('uz')
  })

  it('kurs nomi, yo`nalish, semestr, o`qituvchi va sig`im maydonlarini ko`rsatadi (Req 11.3)', () => {
    renderForm()
    expect(screen.getByLabelText(/kurs nomi/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/ta'lim yo'nalishi/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^semestr$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/o'qituvchi/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/sig'im/i)).toBeInTheDocument()
  })

  it('chegara ichida sig`im bilan yuborish tugmasi faol', () => {
    renderForm()
    const submit = screen.getByRole('button', { name: /kurs yaratish/i })
    expect(submit).toBeEnabled()
  })

  it('BACHELOR sig`imi 300 dan oshganda yuborish bloklanadi va 559-son qarorga havola ko`rsatiladi (Req 11.4, 11.6)', async () => {
    const user = userEvent.setup()
    renderForm()

    const capacity = screen.getByLabelText(/sig'im/i)
    await user.clear(capacity)
    await user.type(capacity, '301')

    expect(screen.getByRole('button', { name: /kurs yaratish/i })).toBeDisabled()
    expect(screen.getByText(/559-son qaror/i)).toBeInTheDocument()
  })

  it('MASTER sig`imi 30 dan oshganda yuborish bloklanadi (Req 11.5)', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.selectOptions(
      screen.getByLabelText(/ta'lim yo'nalishi/i),
      'MASTER',
    )
    const capacity = screen.getByLabelText(/sig'im/i)
    await user.clear(capacity)
    await user.type(capacity, '31')

    expect(screen.getByRole('button', { name: /kurs yaratish/i })).toBeDisabled()
  })
})
