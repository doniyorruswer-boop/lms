// AttendanceCheckIn komponenti uchun unit testlar (Req 9.1, 9.2, 9.3).
//
// Tarmoq qatlami uchun `apiClient` ning axios adapteri test davomida vaqtincha
// almashtiriladi — shunday qilib check-in/check-out so'rovlari haqiqiy HTTP ga
// chiqmasdan boshqariladi va yuborilgan yuk (payload) tekshiriladi.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type {
  AxiosAdapter,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'
import { I18nextProvider } from 'react-i18next'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { apiClient } from '@/shared/api/client'
import i18n from '@/shared/i18n/config'

import { AttendanceCheckIn } from './attendance-check-in'

const PAST_LESSON = '2020-01-01T09:00:00.000Z'
const FUTURE_LESSON = '2999-01-01T09:00:00.000Z'

let originalAdapter: AxiosAdapter | undefined
/** Adapter qabul qilgan so'rovlar (URL + body) — assertlar uchun. */
let capturedRequests: Array<{ url?: string; data: unknown }>

function installAdapter() {
  capturedRequests = []
  originalAdapter = apiClient.defaults.adapter as AxiosAdapter | undefined
  apiClient.defaults.adapter = ((config: InternalAxiosRequestConfig) => {
    capturedRequests.push({
      url: config.url,
      data: config.data ? JSON.parse(config.data as string) : null,
    })
    const response: AxiosResponse = {
      data: {
        id: 'rec-1',
        courseId: 'c-1',
        courseTitle: 'Matematika',
        date: PAST_LESSON,
        checkInAt: PAST_LESSON,
        checkOutAt: null,
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }
    return Promise.resolve(response)
  }) as AxiosAdapter
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>{ui}</I18nextProvider>
    </QueryClientProvider>,
  )
}

describe('AttendanceCheckIn', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('uz')
    installAdapter()
  })

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter
    vi.restoreAllMocks()
  })

  it('dars boshlanmaganda "Darsga kirdim" tugmasini o\'chiradi (Req 9.1)', () => {
    renderWithProviders(
      <AttendanceCheckIn lessonId="l-1" lessonStartAt={FUTURE_LESSON} />,
    )
    const button = screen.getByRole('button', { name: /darsga kirdim/i })
    expect(button).toBeDisabled()
    expect(screen.getByText(/dars hali boshlanmadi/i)).toBeInTheDocument()
  })

  it('dars boshlanganda "Darsga kirdim" tugmasini faollashtiradi (Req 9.1)', () => {
    renderWithProviders(
      <AttendanceCheckIn lessonId="l-1" lessonStartAt={PAST_LESSON} />,
    )
    expect(
      screen.getByRole('button', { name: /darsga kirdim/i }),
    ).toBeEnabled()
  })

  it('"Darsga kirdim" bosilganda vaqtni yuboradi va "Darsdan chiqdim" ga o\'tadi (Req 9.2)', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <AttendanceCheckIn lessonId="l-1" lessonStartAt={PAST_LESSON} />,
    )

    await user.click(screen.getByRole('button', { name: /darsga kirdim/i }))

    expect(
      await screen.findByRole('button', { name: /darsdan chiqdim/i }),
    ).toBeInTheDocument()
    expect(capturedRequests).toHaveLength(1)
    const checkInReq = capturedRequests[0]!
    expect(checkInReq.url).toBe('/attendance/check-in')
    expect(checkInReq.data).toMatchObject({ lessonId: 'l-1' })
    expect((checkInReq.data as { at: string }).at).toBeTruthy()
  })

  it('"Darsdan chiqdim" bosilganda vaqtni yuboradi va sessiyani yopadi (Req 9.3)', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <AttendanceCheckIn
        lessonId="l-1"
        lessonStartAt={PAST_LESSON}
        initialState="in"
      />,
    )

    await user.click(screen.getByRole('button', { name: /darsdan chiqdim/i }))

    expect(
      await screen.findByText(/davomat sessiyasi yopilgan/i),
    ).toBeInTheDocument()
    expect(capturedRequests).toHaveLength(1)
    const checkOutReq = capturedRequests[0]!
    expect(checkOutReq.url).toBe('/attendance/check-out')
    expect(checkOutReq.data).toMatchObject({ lessonId: 'l-1' })
  })
})
