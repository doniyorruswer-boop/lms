// TeacherDashboard uchun unit testlar (Req 10.1).
//
// Tarmoq qatlami uchun `apiClient` ning axios adapteri test davomida vaqtincha
// almashtiriladi — shunday qilib dashboard so'rovlari haqiqiy HTTP ga
// chiqmasdan boshqariladi.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { apiClient } from '@/shared/api/client'
import i18n from '@/shared/i18n/config'

import { TeacherDashboard } from './teacher-dashboard'

let originalAdapter: AxiosAdapter | undefined

/** Berilgan URL → javob xaritasiga ko'ra javob qaytaruvchi adapter o'rnatadi. */
function installAdapter(routes: Record<string, unknown>, fail = false) {
  originalAdapter = apiClient.defaults.adapter as AxiosAdapter | undefined
  apiClient.defaults.adapter = ((config: InternalAxiosRequestConfig) => {
    if (fail) {
      return Promise.reject(new Error('network'))
    }
    const url = config.url ?? ''
    const data = routes[url] ?? null
    const response: AxiosResponse = {
      data,
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
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>{ui}</MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

describe('TeacherDashboard', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('uz')
  })

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter
    vi.restoreAllMocks()
  })

  it('faol kurslar, yaqin darslar va baholanmagan ishlar sonini ko\'rsatadi (Req 10.1)', async () => {
    installAdapter({
      '/courses': {
        items: [
          {
            id: 'c-1',
            title: 'Matematika',
            teacherName: 'A. Valiyev',
            direction: 'BACHELOR',
            semester: 1,
            capacity: 100,
            enrolledCount: 50,
            progressPercent: 0,
          },
        ],
        page: 1,
        pageSize: 10,
        total: 1,
      },
      '/lessons/upcoming': [
        {
          id: 'l-1',
          courseId: 'c-1',
          title: '1-dars',
          date: '2024-03-20',
          durationMin: 90,
          videoUrl: null,
          materials: [],
        },
      ],
      '/assessments/ungraded-count': { count: 7 },
    })

    renderWithProviders(<TeacherDashboard />)

    expect(await screen.findByText('Matematika')).toBeInTheDocument()
    expect(screen.getByText('1-dars')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('backend xatosida xato xabari va "Qayta urinish" tugmasini ko\'rsatadi (Req 10.1)', async () => {
    installAdapter({}, true)

    renderWithProviders(<TeacherDashboard />)

    expect(
      await screen.findByText(/ma'lumotlarni yuklab bo'lmadi/i),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /qayta urinish/i }),
    ).toBeInTheDocument()
  })
})
