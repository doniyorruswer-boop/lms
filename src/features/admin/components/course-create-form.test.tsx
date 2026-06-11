// CourseCreateForm uchun unit testlar (Req 11.3, 11.4, 11.6).
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import i18n from '@/shared/i18n/config'

import {
  CourseCreateForm,
  RESOLUTION_559_CLAUSE_20_URL,
} from './course-create-form'

function renderForm(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  render(
    <I18nextProvider i18n={i18n}>
      <CourseCreateForm onSubmit={onSubmit} />
    </I18nextProvider>,
  )
  return { onSubmit }
}

describe('CourseCreateForm', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('uz')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the course fields (Req 11.3)', () => {
    renderForm()
    expect(screen.getByLabelText(/kurs nomi/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/ta'lim yo'nalishi/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/semestr/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/o'qituvchi/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/sig'im/i)).toBeInTheDocument()
  })

  it('blocks submit and shows the 559 clause-20 link when BACHELOR capacity > 300 (Req 11.6)', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderForm()

    await user.type(screen.getByLabelText(/kurs nomi/i), 'Matematika')
    await user.type(screen.getByLabelText(/o'qituvchi/i), 'Aliyev')

    const capacity = screen.getByLabelText(/sig'im/i)
    await user.clear(capacity)
    await user.type(capacity, '301')

    // Submit blokirovkasi: tugma o'chirilgan bo'lishi kerak.
    const submit = screen.getByRole('button', { name: /yaratish/i })
    await waitFor(() => expect(submit).toBeDisabled())

    // 559-son qaror, 20-bandga havola ko'rsatiladi.
    const link = await screen.findByRole('link', {
      name: /559-son qaror, 20-band/i,
    })
    expect(link).toHaveAttribute('href', RESOLUTION_559_CLAUSE_20_URL)

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits valid values within the BACHELOR limit (Req 11.3)', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderForm()

    await user.type(screen.getByLabelText(/kurs nomi/i), 'Fizika')
    await user.type(screen.getByLabelText(/o'qituvchi/i), 'Karimov')

    const capacity = screen.getByLabelText(/sig'im/i)
    await user.clear(capacity)
    await user.type(capacity, '250')

    await user.click(screen.getByRole('button', { name: /yaratish/i }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    // React Hook Form submit handlerga (data, event) uzatadi — birinchi
    // argument tasdiqlangan qiymatlar, ikkinchisi hodisa.
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Fizika',
        teacherName: 'Karimov',
        direction: 'BACHELOR',
        capacity: 250,
      }),
      expect.anything(),
    )
  })

  it('enforces the MASTER limit of 30 (Req 11.5)', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderForm()

    await user.type(screen.getByLabelText(/kurs nomi/i), 'Tadqiqot')
    await user.type(screen.getByLabelText(/o'qituvchi/i), 'Saidova')
    await user.selectOptions(
      screen.getByLabelText(/ta'lim yo'nalishi/i),
      'MASTER',
    )

    const capacity = screen.getByLabelText(/sig'im/i)
    await user.clear(capacity)
    await user.type(capacity, '31')

    const submit = screen.getByRole('button', { name: /yaratish/i })
    await waitFor(() => expect(submit).toBeDisabled())
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
