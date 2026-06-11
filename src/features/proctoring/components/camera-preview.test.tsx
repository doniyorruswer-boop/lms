// CameraPreview komponenti uchun unit testlar (Req 8.6).
import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import i18n from '@/shared/i18n/config'

import { CameraPreview } from './camera-preview'

function renderWithI18n(ui: React.ReactElement) {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>)
}

describe('CameraPreview', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('uz')
    // jsdom HTMLMediaElement.play ni amalga oshirmaydi — resolved promise bilan
    // almashtirilib, preview avtomatik ijrosida xato bo'lishining oldini olamiz.
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('stream bo\'lmaganda joy egasi (placeholder) ko\'rsatadi', () => {
    const ref = createRef<HTMLVideoElement>()
    renderWithI18n(<CameraPreview stream={null} videoRef={ref} />)

    expect(screen.getByText(/mavjud emas/i)).toBeInTheDocument()
  })

  it('stream berilganda video elementga srcObject biriktiradi', () => {
    const ref = createRef<HTMLVideoElement>()
    const fakeStream = {
      getTracks: () => [],
    } as unknown as MediaStream

    renderWithI18n(<CameraPreview stream={fakeStream} videoRef={ref} />)

    expect(ref.current).not.toBeNull()
    expect(ref.current!.srcObject).toBe(fakeStream)
  })

  it('video elementiga ulashga mo\'ljallangan aria-label beradi (a11y)', () => {
    const ref = createRef<HTMLVideoElement>()
    renderWithI18n(<CameraPreview stream={null} videoRef={ref} />)

    expect(screen.getByLabelText(/kamera/i)).toBeInTheDocument()
  })
})
