// useProctoring hooki uchun unit testlar (Req 8.3, 8.4, 8.5).
//
// face-api.js modul DINAMIK import qilinadi, shu sababli testda uni soxta
// (mock) qilamiz — bu og'ir kutubxonani yuklamaslik va aniqlashni boshqarish
// uchun. Tarmoq qatlami uchun `apiClient` ning axios adapteri vaqtincha
// almashtiriladi va yuborilgan proktoring hodisalari tekshiriladi.
import { createRef } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import type {
  AxiosAdapter,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { apiClient } from '@/shared/api/client'

import { useProctoring } from './use-proctoring'

// face-api.js adapterini soxta qilamiz — model yuklash hech narsa qilmaydi.
vi.mock('../lib/face-detection', () => ({
  loadFaceApiModels: () => Promise.resolve(false),
  detectFaces: () => Promise.resolve([]),
}))

let originalAdapter: AxiosAdapter | undefined
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
      data: { ok: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }
    return Promise.resolve(response)
  }) as AxiosAdapter
}

/** `current` da haqiqiy <video> elementi bo'lgan ref yaratadi. */
function videoRefWithElement() {
  const ref = createRef<HTMLVideoElement>()
  const video = document.createElement('video')
  Object.defineProperty(ref, 'current', { value: video, writable: true })
  return ref
}

describe('useProctoring', () => {
  beforeEach(() => {
    installAdapter()
  })

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter
    vi.restoreAllMocks()
  })

  it('active bo\'lmaganda hech qanday hodisa yubormaydi', async () => {
    const ref = videoRefWithElement()
    renderHook(() =>
      useProctoring({
        assessmentId: 'a-1',
        videoRef: ref,
        active: false,
        detector: vi.fn().mockResolvedValue([{}]),
      }),
    )

    await new Promise((r) => setTimeout(r, 10))
    expect(capturedRequests).toHaveLength(0)
  })

  it('yuz topilmaganda "violation" hodisasini yuboradi va ogohlantiradi (Req 8.4)', async () => {
    const ref = videoRefWithElement()
    const detector = vi.fn().mockResolvedValue([]) // 0 yuz → violation
    const { result } = renderHook(() =>
      useProctoring({
        assessmentId: 'a-1',
        videoRef: ref,
        active: true,
        detector,
      }),
    )

    await waitFor(() => {
      expect(
        capturedRequests.some((r) => r.url === '/proctoring/events'),
      ).toBe(true)
    })

    const event = capturedRequests.find(
      (r) => r.url === '/proctoring/events',
    )!
    expect(event.data).toMatchObject({
      assessmentId: 'a-1',
      type: 'violation',
      faceCount: 0,
    })
    await waitFor(() => expect(result.current.hasWarning).toBe(true))
  })

  it('bitta yuz aniqlanganda "ok" hodisasini yuboradi va ogohlantirmaydi', async () => {
    const ref = videoRefWithElement()
    const detector = vi.fn().mockResolvedValue([{}]) // 1 yuz → ok
    const { result } = renderHook(() =>
      useProctoring({
        assessmentId: 'a-2',
        videoRef: ref,
        active: true,
        detector,
      }),
    )

    await waitFor(() => {
      expect(
        capturedRequests.some(
          (r) =>
            r.url === '/proctoring/events' &&
            (r.data as { type: string }).type === 'ok',
        ),
      ).toBe(true)
    })
    expect(result.current.hasWarning).toBe(false)
  })

  it('window blur hodisasida "tab_switch" yuboradi (Req 8.5)', async () => {
    const ref = videoRefWithElement()
    renderHook(() =>
      useProctoring({
        assessmentId: 'a-3',
        videoRef: ref,
        active: true,
        detector: vi.fn().mockResolvedValue([{}]),
      }),
    )

    act(() => {
      window.dispatchEvent(new Event('blur'))
    })

    await waitFor(() => {
      expect(
        capturedRequests.some(
          (r) =>
            r.url === '/proctoring/events' &&
            (r.data as { type: string }).type === 'tab_switch',
        ),
      ).toBe(true)
    })
  })
})
