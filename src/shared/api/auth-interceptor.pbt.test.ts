// Feature: lms-frontend, Property 5: Refresh-singleton invariant
//
// Property 5: N >= 1 ta parallel API so'rovi 401 Unauthorized bilan tugaganda,
// `/auth/refresh` chaqiruvi soni aniq 1 ga teng bo'lishi kerak (single-flight);
// refresh muvaffaqiyatli tugagach barcha asl so'rovlar yangi access token bilan
// qayta yuboriladi va muvaffaqiyatli yakunlanadi.
//
// Validates: Requirements 1.6, 21.3

import axios, {
  AxiosError,
  type AxiosAdapter,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import fc from 'fast-check'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  attachRefreshInterceptor,
  resetRefreshState,
  type RefreshTokensFn,
} from '@/shared/api/auth-interceptor'
import { endpoints } from '@/shared/api/endpoints'
import type { TokenStorage } from '@/shared/auth/token-storage'
import type { JwtTokens } from '@/shared/types'

const OLD_ACCESS_TOKEN = 'old-access-token'
const NEW_ACCESS_TOKEN = 'new-access-token'
const REFRESH_TOKEN = 'refresh-token'

/**
 * Mock axios adapteri: faqat YANGI access token bilan kelgan so'rovga 200
 * qaytaradi; aks holda (eski token / token yo'q) 401 Unauthorized qaytaradi.
 *
 * Bu refresh siklini modellashtiradi: birinchi urinish (eski token) 401 oladi,
 * interceptor refresh qilib yangi token bilan qayta urinadi va 200 oladi.
 */
function createMockAdapter(): AxiosAdapter {
  return (config: InternalAxiosRequestConfig) => {
    const authHeader = config.headers?.get('Authorization') as
      | string
      | undefined

    if (authHeader === `Bearer ${NEW_ACCESS_TOKEN}`) {
      const response: AxiosResponse = {
        data: { ok: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }
      return Promise.resolve(response)
    }

    const unauthorized = new AxiosError(
      'Unauthorized',
      'ERR_BAD_REQUEST',
      config,
      null,
      {
        data: { message: 'Unauthorized' },
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config,
      },
    )
    return Promise.reject(unauthorized)
  }
}

/** Refresh muvaffaqiyatli bo'lganda qaytariladigan yangi tokenlar. */
function newTokens(): JwtTokens {
  return {
    accessToken: NEW_ACCESS_TOKEN,
    refreshToken: REFRESH_TOKEN,
    expiresAt: Date.now() + 60_000,
  }
}

/** Sodda in-memory token storage (localStorage o'rniga). */
function createStorageStub(): TokenStorage {
  let access: string | null = OLD_ACCESS_TOKEN
  return {
    getAccessToken: () => access,
    getRefreshToken: () => REFRESH_TOKEN,
    setTokens: (tokens) => {
      access = tokens.accessToken
    },
    clear: () => {
      access = null
    },
  }
}

afterEach(() => {
  resetRefreshState()
  vi.restoreAllMocks()
})

describe('Property 5: Refresh-token singleton invariant', () => {
  it('N>=1 parallel 401 lar aniq bitta /auth/refresh chaqiradi va barchasi yangi token bilan muvaffaqiyatli qayta urinadi', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 20 }), async (n) => {
        // Har bir iteratsiya uchun single-flight holatini tiklaymiz.
        resetRefreshState()

        const client: AxiosInstance = axios.create({
          adapter: createMockAdapter(),
        })

        // refreshTokens spy — chaqiruvlar sonini hisoblaydi.
        const refreshTokens = vi.fn<RefreshTokensFn>(async () => newTokens())
        const redirectToLogin = vi.fn()

        attachRefreshInterceptor(client, {
          refreshTokens,
          redirectToLogin,
          storage: createStorageStub(),
        })

        // N ta parallel so'rov — har biri eski token bilan ketadi -> 401.
        const requests = Array.from({ length: n }, (_, i) =>
          client.get(`/courses?req=${i}`),
        )

        const responses = await Promise.all(requests)

        // 1) Refresh chaqiruvi aniq bir marta amalga oshdi (single-flight).
        expect(refreshTokens).toHaveBeenCalledTimes(1)

        // 2) Barcha asl so'rovlar yangi access token bilan qayta yuborilib,
        //    muvaffaqiyatli (200) yakunlandi.
        expect(responses).toHaveLength(n)
        for (const response of responses) {
          expect(response.status).toBe(200)
          expect(response.config.headers.get('Authorization')).toBe(
            `Bearer ${NEW_ACCESS_TOKEN}`,
          )
        }

        // 3) Refresh muvaffaqiyatli bo'lgani uchun login ga yo'naltirilmadi.
        expect(redirectToLogin).not.toHaveBeenCalled()
      }),
      { numRuns: 100 },
    )
  })

  it('refresh so\'rovining o\'zi 401 bo\'lsa qayta refresh urinilmaydi (cheksiz rekursiya yo\'q)', async () => {
    // Sanity: refresh endpointiga 401 kelganda interceptor refresh qilmaydi.
    resetRefreshState()

    const client = axios.create({
      adapter: (config: InternalAxiosRequestConfig) => {
        const unauthorized = new AxiosError(
          'Unauthorized',
          'ERR_BAD_REQUEST',
          config,
          null,
          {
            data: {},
            status: 401,
            statusText: 'Unauthorized',
            headers: {},
            config,
          },
        )
        return Promise.reject(unauthorized)
      },
    })

    const refreshTokens = vi.fn<RefreshTokensFn>(async () => newTokens())
    attachRefreshInterceptor(client, {
      refreshTokens,
      redirectToLogin: vi.fn(),
      storage: createStorageStub(),
    })

    await expect(client.post(endpoints.auth.refresh, {})).rejects.toThrow()
    expect(refreshTokens).not.toHaveBeenCalled()
  })
})
