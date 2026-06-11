// useCameraPermission hooki uchun unit testlar (Req 8.1, 8.2).
//
// `navigator.mediaDevices.getUserMedia` muhitga qarab mavjud bo'lmasligi mumkin
// (jsdom), shu sababli har testda uni boshqariladigan tarzda o'rnatamiz.
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useCameraPermission } from './use-camera-permission'

/** To'xtatish (`stop`) chaqiruvlarini kuzatish uchun soxta track. */
function makeFakeStream() {
  const track = { stop: vi.fn() }
  return {
    getTracks: () => [track],
    _track: track,
  } as unknown as MediaStream & { _track: { stop: ReturnType<typeof vi.fn> } }
}

const originalNavigator = globalThis.navigator

function setMediaDevices(
  getUserMedia: ((c: MediaStreamConstraints) => Promise<MediaStream>) | null,
) {
  if (getUserMedia === null) {
    // getUserMedia ni qo'llab-quvvatlamaydigan muhit.
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {},
    })
    return
  }
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { mediaDevices: { getUserMedia } },
  })
}

describe('useCameraPermission', () => {
  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: originalNavigator,
    })
    vi.restoreAllMocks()
  })

  it('boshlang\'ich holat "idle" va bloklanmagan', () => {
    setMediaDevices(vi.fn())
    const { result } = renderHook(() => useCameraPermission())
    expect(result.current.state).toBe('idle')
    expect(result.current.isBlocked).toBe(false)
    expect(result.current.stream).toBeNull()
  })

  it('ruxsat berilganda "granted" holatga o\'tadi va streamni saqlaydi (Req 8.1)', async () => {
    const stream = makeFakeStream()
    setMediaDevices(vi.fn().mockResolvedValue(stream))
    const { result } = renderHook(() => useCameraPermission())

    await act(async () => {
      await result.current.request()
    })

    expect(result.current.state).toBe('granted')
    expect(result.current.stream).toBe(stream)
    expect(result.current.isBlocked).toBe(false)
  })

  it('ruxsat rad etilganda "denied" va bloklangan bo\'ladi (Req 8.2)', async () => {
    setMediaDevices(vi.fn().mockRejectedValue(new Error('NotAllowedError')))
    const { result } = renderHook(() => useCameraPermission())

    await act(async () => {
      await result.current.request()
    })

    expect(result.current.state).toBe('denied')
    expect(result.current.isBlocked).toBe(true)
    expect(result.current.stream).toBeNull()
  })

  it('getUserMedia mavjud bo\'lmaganda "unsupported" va bloklangan (Req 8.2)', async () => {
    setMediaDevices(null)
    const { result } = renderHook(() => useCameraPermission())

    await act(async () => {
      await result.current.request()
    })

    expect(result.current.state).toBe('unsupported')
    expect(result.current.isBlocked).toBe(true)
  })

  it('stop streamning barcha treklarini to\'xtatadi', async () => {
    const stream = makeFakeStream()
    setMediaDevices(vi.fn().mockResolvedValue(stream))
    const { result } = renderHook(() => useCameraPermission())

    await act(async () => {
      await result.current.request()
    })
    await waitFor(() => expect(result.current.stream).toBe(stream))

    act(() => {
      result.current.stop()
    })

    expect(stream._track.stop).toHaveBeenCalled()
    expect(result.current.stream).toBeNull()
  })
})
