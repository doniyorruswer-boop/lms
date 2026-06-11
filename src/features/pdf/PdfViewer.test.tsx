// PdfViewer komponenti uchun unit testlar (Req 5.1, 5.2, 5.3, 5.4).
//
// react-pdf `Document`/`Page` jsdom da haqiqiy pdf.js worker talab qiladi,
// shuning uchun ularni mock qilamiz: mock `Document` `file` proppiga qarab
// `onLoadSuccess` (normal) yoki `onLoadError` (buzilgan fayl) ni chaqiradi.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import i18n from '@/shared/i18n/config'

// react-pdf ni mock qilamiz — pdf.js worker / haqiqiy render kerak emas.
vi.mock('react-pdf', async () => {
  const React = await import('react')
  return {
    pdfjs: { GlobalWorkerOptions: { workerSrc: '' } },
    Document: ({
      file,
      onLoadSuccess,
      onLoadError,
      children,
    }: {
      file: unknown
      onLoadSuccess?: (pdf: { numPages: number }) => void
      onLoadError?: (error: Error) => void
      children?: React.ReactNode
    }) => {
      React.useEffect(() => {
        const isBrokenString =
          typeof file === 'string' && file.includes('broken')
        const isBrokenData =
          !!file &&
          typeof file === 'object' &&
          'data' in (file as Record<string, unknown>) &&
          (file as { data: Uint8Array }).data[0] === 0
        if (isBrokenString || isBrokenData) {
          onLoadError?.(new Error('Failed to load PDF'))
        } else {
          onLoadSuccess?.({ numPages: 5 })
        }
      }, [file, onLoadSuccess, onLoadError])
      return React.createElement(
        'div',
        { 'data-testid': 'pdf-document' },
        children
      )
    },
    Page: ({ pageNumber }: { pageNumber: number }) =>
      React.createElement(
        'div',
        { 'data-testid': 'pdf-page' },
        `page-${pageNumber}`
      ),
  }
})

// pdf-worker side-effect modulini neytrallaymiz (mock pdfjs bilan ishlamasligi
// uchun) — `import.meta.url` worker URL resolyutsiyasi testda kerak emas.
vi.mock('./lib/pdf-worker', () => ({}))

import { PdfViewer, type PdfViewerProps } from './PdfViewer'

function renderViewer(props: Partial<PdfViewerProps> = {}) {
  return render(
    <I18nextProvider i18n={i18n}>
      <PdfViewer file="https://example.com/doc.pdf" {...props} />
    </I18nextProvider>
  )
}

describe('PdfViewer', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('uz')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('hujjat yuklangach navigatsiya boshqaruvlarini ko\'rsatadi (Req 5.1, 5.2)', async () => {
    renderViewer()

    // Yuklash muvaffaqiyatli — sahifa raqami ko'rsatkichi 5 ta sahifani aks ettiradi.
    expect(await screen.findByText('1 / 5')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /oldingi sahifa/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /keyingi sahifa/i })
    ).toBeInTheDocument()
    // Birinchi sahifada "oldingi" tugmasi o'chirilgan.
    expect(screen.getByRole('button', { name: /oldingi sahifa/i })).toBeDisabled()
  })

  it('keyingi/oldingi sahifa tugmalari sahifani [1, total] ichida o\'zgartiradi (Req 5.2)', async () => {
    const user = userEvent.setup()
    renderViewer()
    await screen.findByText('1 / 5')

    const next = screen.getByRole('button', { name: /keyingi sahifa/i })
    await user.click(next)
    expect(screen.getByText('2 / 5')).toBeInTheDocument()

    const prev = screen.getByRole('button', { name: /oldingi sahifa/i })
    await user.click(prev)
    expect(screen.getByText('1 / 5')).toBeInTheDocument()
  })

  it('sahifaga o\'tish maydonida total dan katta qiymat clamp qilinadi (Req 5.2)', async () => {
    const user = userEvent.setup()
    renderViewer()
    await screen.findByText('1 / 5')

    const input = screen.getByLabelText(/sahifaga o'tish/i) as HTMLInputElement
    await user.clear(input)
    await user.type(input, '99')

    // clampPage natijasida oxirgi sahifa (5) ga clamp qilinadi.
    expect(screen.getByText('5 / 5')).toBeInTheDocument()
  })

  it('zoom va to\'liq ekran boshqaruvlari mavjud (Req 5.2)', async () => {
    renderViewer()
    await screen.findByText('1 / 5')

    expect(
      screen.getByRole('button', { name: /kattalashtirish/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /kichiklashtirish/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /to'liq ekran/i })
    ).toBeInTheDocument()
  })

  it('matn qidirish maydonini ta\'minlaydi (Req 5.3)', async () => {
    renderViewer()
    await screen.findByText('1 / 5')

    expect(
      screen.getByPlaceholderText(/matn bo'yicha qidirish/i)
    ).toBeInTheDocument()
  })

  it('buzilgan faylda xato xabari va yuklab olish havolasini ko\'rsatadi (Req 5.4)', async () => {
    const onLoadError = vi.fn()
    renderViewer({ file: 'https://example.com/broken.pdf', onLoadError })

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/yuklab bo'lmadi|buzilgan/i)

    const downloadLink = screen.getByRole('link', {
      name: /faylni yuklab olish/i,
    })
    expect(downloadLink).toHaveAttribute('href', 'https://example.com/broken.pdf')
    expect(onLoadError).toHaveBeenCalledTimes(1)
  })

  it('xato holatida explicit downloadUrl ishlatiladi (Req 5.4)', async () => {
    renderViewer({
      file: 'https://example.com/broken.pdf',
      downloadUrl: 'https://cdn.example.com/alt.pdf',
    })

    await screen.findByRole('alert')
    const downloadLink = screen.getByRole('link', {
      name: /faylni yuklab olish/i,
    })
    expect(downloadLink).toHaveAttribute('href', 'https://cdn.example.com/alt.pdf')
  })

  it('URL mavjud bo\'lmaganda (data manbai) xatoda havola ko\'rsatilmaydi (Req 5.4)', async () => {
    // `{ data }` manbasi uchun yuklab olish URL yo'q. Buzilgan data ([0,...])
    // bilan xato holatga o'tiladi va alternativ havola ko'rsatilmaydi.
    const data = new Uint8Array([0, 1, 2])
    renderViewer({ file: { data } })

    await screen.findByRole('alert')
    expect(
      screen.queryByRole('link', { name: /faylni yuklab olish/i })
    ).not.toBeInTheDocument()
  })
})
