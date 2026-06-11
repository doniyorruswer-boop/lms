// MonitoringDashboard uchun unit testlar (Req 13.1, 13.2, 13.3, 13.6).
//
// `apiClient` ning axios adapteri test davomida vaqtincha almashtiriladi —
// monitoring so'rovlari haqiqiy HTTP ga chiqmasdan boshqariladi.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import type {
  AxiosAdapter,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'
import { I18nextProvider } from 'react-i18next'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { apiClient } from '@/shared/api/client'
import i18n from '@/shared/i18n/config'
import type { ContingentStat, OtmStats } from '@/shared/types'

import { MonitoringDashboard } from './monitoring-dashboard'

let originalAdapter: AxiosAdapter | undefined

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

const otmStats: OtmStats[] = [
  {
    otmId: 'otm-a',
    otmName: 'OTM A',
    studentCount: 300,
    teacherCount: 5,
    courseCount: 10,
    ratio: 60,
  },
  {
    otmId: 'otm-b',
    otmName: 'OTM B',
    studentCount: 40,
    teacherCount: 2,
    courseCount: 5,
    ratio: 20,
  },
]

const contingent: ContingentStat[] = [
  { otmId: 'otm-a', otmName: 'OTM A', bachelorCount: 250, masterCount: 50 },
  { otmId: 'otm-b', otmName: 'OTM B', bachelorCount: 30, masterCount: 10 },
]

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>{ui}</I18nextProvider>
    </QueryClientProvider>
  )
}

describe('MonitoringDashboard', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('uz')
  })

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter
    vi.restoreAllMocks()
  })

  it('indikator kartochkalari va OTM jadvalini ko\'rsatadi (Req 13.1, 13.2)', async () => {
    installAdapter({
      '/monitoring/otm-stats': otmStats,
      '/monitoring/contingent': contingent,
    })

    renderWithProviders(<MonitoringDashboard />)

    // Indikator kartochkalari: umumiy talabalar (300 + 40 = 340)
    expect(await screen.findByText('340')).toBeInTheDocument()
    // Umumiy kurslar (10 + 5 = 15)
    expect(screen.getByText('15')).toBeInTheDocument()

    // Jadval qatorlari (OTM nomlari jadval, diagramma va kontingentda takrorlanadi)
    expect(screen.getAllByText('OTM A').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('OTM B').length).toBeGreaterThanOrEqual(1)
    // Jadvaldagi talabalar soni
    expect(screen.getByText('300')).toBeInTheDocument()
  })

  it('1:50 dan oshgan OTM ni "Norma buzilgan" yorlig\'i bilan ajratadi (Req 13.3)', async () => {
    installAdapter({
      '/monitoring/otm-stats': otmStats,
      '/monitoring/contingent': contingent,
    })

    renderWithProviders(<MonitoringDashboard />)

    // Faqat OTM A (300/5 = 60 > 50) buzilgan
    const violations = await screen.findAllByText('Norma buzilgan')
    expect(violations).toHaveLength(1)
  })

  it('CSV va PDF eksport tugmalarini ko\'rsatadi (Req 13.6)', async () => {
    installAdapter({
      '/monitoring/otm-stats': otmStats,
      '/monitoring/contingent': contingent,
    })

    renderWithProviders(<MonitoringDashboard />)

    expect(
      await screen.findByRole('button', { name: /csv eksport/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /pdf eksport/i })
    ).toBeInTheDocument()
  })

  it('backend xatosida xato xabari va "Qayta urinish" tugmasini ko\'rsatadi', async () => {
    installAdapter({}, true)

    renderWithProviders(<MonitoringDashboard />)

    expect(
      await screen.findByText(/ma'lumotlarni yuklab bo'lmadi/i)
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /qayta urinish/i })
    ).toBeInTheDocument()
  })
})
