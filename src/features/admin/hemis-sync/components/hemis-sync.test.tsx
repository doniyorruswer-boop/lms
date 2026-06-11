// HEMIS_Sync_UI uchun testlar (Req 12.1–12.6).
//
// Tarmoq qatlami uchun `apiClient` ning axios adapteri test davomida vaqtincha
// almashtiriladi — so'rovlar haqiqiy HTTP ga chiqmaydi va javoblar test
// senariysiga qarab boshqariladi.

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
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
import type { SyncJob } from '@/shared/types'

import { SyncControls } from './sync-controls'
import { SyncFinalReport } from './sync-final-report'
import { SyncHistoryTable } from './sync-history-table'
import { HemisSyncPage } from './hemis-sync-page'

function makeJob(overrides: Partial<SyncJob> = {}): SyncJob {
  return {
    id: 'job-1',
    type: 'students',
    status: 'completed',
    processed: 80,
    created: 12,
    errors: 3,
    total: 100,
    startedAt: '2024-01-01T09:00:00.000Z',
    finishedAt: '2024-01-01T09:05:00.000Z',
    errorMessage: null,
    ...overrides,
  }
}

// --- apiClient adapter boshqaruvi -------------------------------------------

let originalAdapter: AxiosAdapter | undefined
let handler: (config: InternalAxiosRequestConfig) => unknown

function installAdapter() {
  originalAdapter = apiClient.defaults.adapter as AxiosAdapter | undefined
  apiClient.defaults.adapter = ((config: InternalAxiosRequestConfig) => {
    const data = handler(config)
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

beforeEach(async () => {
  await i18n.changeLanguage('uz')
  installAdapter()
})

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter
  vi.restoreAllMocks()
})

// --- SyncControls (Req 12.1, 12.2, 12.3) ------------------------------------

describe('SyncControls', () => {
  it('uchta sinxronlash tugmasini ko\'rsatadi (Req 12.1)', () => {
    renderWithProviders(
      <SyncControls
        activeJob={null}
        isStarting={false}
        pendingType={null}
        onStart={() => {}}
      />,
    )
    expect(
      screen.getByRole('button', { name: /talabalarni sinxronlash/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /o'qituvchilarni sinxronlash/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /kurslarni sinxronlash/i }),
    ).toBeInTheDocument()
  })

  it('tugma bosilganda tegishli tur bilan onStart chaqiriladi (Req 12.2)', async () => {
    const user = userEvent.setup()
    const onStart = vi.fn()
    renderWithProviders(
      <SyncControls
        activeJob={null}
        isStarting={false}
        pendingType={null}
        onStart={onStart}
      />,
    )
    await user.click(
      screen.getByRole('button', { name: /talabalarni sinxronlash/i }),
    )
    expect(onStart).toHaveBeenCalledWith('students')
  })

  it('job ishlayotganda holat ko\'rsatkichi va progress barni ko\'rsatadi (Req 12.2, 12.3)', () => {
    renderWithProviders(
      <SyncControls
        activeJob={makeJob({ status: 'running', processed: 40, total: 100 })}
        isStarting={false}
        pendingType={null}
        onStart={() => {}}
      />,
    )
    expect(screen.getByTestId('sync-status')).toHaveTextContent(/ishlamoqda/i)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '40')
    // Faol job davomida tugmalar bloklanadi.
    expect(
      screen.getByRole('button', { name: /talabalarni sinxronlash/i }),
    ).toBeDisabled()
  })

  it('progress foizini computeProgressPct orqali [0,100] ga clamp qiladi (Req 12.3)', () => {
    renderWithProviders(
      <SyncControls
        activeJob={makeJob({ status: 'running', processed: 200, total: 100 })}
        isStarting={false}
        pendingType={null}
        onStart={() => {}}
      />,
    )
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '100',
    )
  })
})

// --- SyncFinalReport (Req 12.4, 12.6) ---------------------------------------

describe('SyncFinalReport', () => {
  it('yakunlanganda qayta ishlangan/yangi/xato sonini ko\'rsatadi (Req 12.4)', () => {
    renderWithProviders(
      <SyncFinalReport
        job={makeJob({ status: 'completed', processed: 80, created: 12, errors: 3 })}
        onDownloadLog={() => {}}
      />,
    )
    expect(screen.getByText('80')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('xatoda sabab va loglarni yuklab olish havolasini ko\'rsatadi (Req 12.6)', async () => {
    const user = userEvent.setup()
    const onDownloadLog = vi.fn()
    renderWithProviders(
      <SyncFinalReport
        job={makeJob({ status: 'error', errorMessage: 'HEMIS ulanmadi' })}
        onDownloadLog={onDownloadLog}
      />,
    )
    expect(screen.getByText(/hemis ulanmadi/i)).toBeInTheDocument()
    const downloadBtn = screen.getByRole('button', {
      name: /loglarni yuklab olish/i,
    })
    await user.click(downloadBtn)
    expect(onDownloadLog).toHaveBeenCalledWith('job-1')
  })
})

// --- SyncHistoryTable (Req 12.5, 12.6) --------------------------------------

describe('SyncHistoryTable', () => {
  it('bo\'sh tarixda xabar ko\'rsatadi', () => {
    renderWithProviders(
      <SyncHistoryTable jobs={[]} onDownloadLog={() => {}} />,
    )
    expect(screen.getByText(/sinxronlash tarixi mavjud emas/i)).toBeInTheDocument()
  })

  it('tarix satrlarini tur, holat va hisobot bilan ko\'rsatadi (Req 12.5)', () => {
    renderWithProviders(
      <SyncHistoryTable
        jobs={[
          makeJob({ id: 'j1', type: 'teachers', status: 'completed' }),
        ]}
        onDownloadLog={() => {}}
      />,
    )
    const row = screen.getByText(/o'qituvchilar/i).closest('tr')!
    expect(within(row).getByText(/yakunlandi/i)).toBeInTheDocument()
    expect(within(row).getByText(/qayta ishlangan/i)).toBeInTheDocument()
  })

  it('xato satri uchun sabab va yuklab olish havolasini ko\'rsatadi (Req 12.6)', async () => {
    const user = userEvent.setup()
    const onDownloadLog = vi.fn()
    renderWithProviders(
      <SyncHistoryTable
        jobs={[
          makeJob({ id: 'jerr', status: 'error', errorMessage: 'Vaqt tugadi' }),
        ]}
        onDownloadLog={onDownloadLog}
      />,
    )
    expect(screen.getByText(/vaqt tugadi/i)).toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: /loglarni yuklab olish/i }),
    )
    expect(onDownloadLog).toHaveBeenCalledWith('jerr')
  })
})

// --- HemisSyncPage integratsiyasi (Req 12.1, 12.2, 12.4, 12.5) --------------

describe('HemisSyncPage', () => {
  it('boshlanganda sinxronlashni POST qiladi va yakuniy hisobotni ko\'rsatadi', async () => {
    const user = userEvent.setup()
    const postedUrls: string[] = []
    handler = (config) => {
      if (config.method === 'post') {
        postedUrls.push(config.url ?? '')
        return makeJob({ id: 'job-9', status: 'started', total: 100, processed: 0 })
      }
      if (config.url === '/sync/jobs') {
        return { items: [], page: 1, pageSize: 20, total: 0 }
      }
      // status poll → darhol yakunlangan job qaytaramiz.
      return makeJob({ id: 'job-9', status: 'completed', processed: 100, total: 100 })
    }

    renderWithProviders(<HemisSyncPage />)

    await user.click(
      screen.getByRole('button', { name: /talabalarni sinxronlash/i }),
    )

    // "Qayta ishlangan" yorlig'i faqat yakuniy hisobot kartochkasida bor.
    expect(
      await screen.findByText('Qayta ishlangan', { exact: true }),
    ).toBeInTheDocument()
    expect(postedUrls).toContain('/sync/students')
  })

  it('tarix jadvalini backenddan yuklab ko\'rsatadi (Req 12.5)', async () => {
    handler = (config) => {
      if (config.url === '/sync/jobs') {
        return {
          items: [makeJob({ id: 'h1', type: 'courses', status: 'completed' })],
          page: 1,
          pageSize: 20,
          total: 1,
        }
      }
      return makeJob()
    }

    renderWithProviders(<HemisSyncPage />)

    expect(await screen.findByText(/kurslar/i)).toBeInTheDocument()
  })
})
