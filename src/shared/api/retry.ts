// 5xx eksponensial backoff retry interceptori (Req 21.4).
//
// Server xatolari (5xx) uchun idempotent so'rovlarni eng ko'pi bilan 3 marta
// qayta urinadi. Kechikishlar `compute5xxRetryDelay` jadvali bo'yicha
// [300, 900, 2700] ms tartibida amalga oshadi. Idempotent so'rov uchun
// server `k` ta 5xx javobdan keyin muvaffaqiyat qaytarsa, jami HTTP
// chaqiruvlar soni `k + 1` bo'ladi (`k ∈ {0, 1, 2, 3}`); `k > 3` bo'lsa
// oxirgi xato yuqoriga uzatiladi.
//
// See design.md "Property 28: 5xx urinishlar soni va kechikishlari".
//
// Bu modul ATAYLAB `client.ts` ni o'zgartirmaydi — u faqat eksport qilingan
// axios instance ga ulanadigan interceptor funksiyasini taqdim etadi. Real
// kechikish `delay` funksiyasi orqali in'ektsiya qilinadi, shuning uchun
// testlarda vaqtni nazorat qilish mumkin.

import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'

import { compute5xxRetryDelay } from '@/shared/lib/backoff'

/** 5xx javoblar uchun maksimal qayta urinishlar soni (Req 21.4). */
export const MAX_5XX_RETRIES = 3

/**
 * Qayta urinish xavfsiz (idempotent) hisoblangan HTTP metodlari.
 *
 * HTTP semantikasiga ko'ra ushbu metodlarni takrorlash qo'shimcha
 * nojo'ya ta'sir keltirmaydi, shuning uchun ular xavfsiz qayta urilishi
 * mumkin. POST/PATCH kabi idempotent bo'lmagan metodlar qayta urilmaydi.
 */
const IDEMPOTENT_METHODS: ReadonlySet<string> = new Set([
  'get',
  'head',
  'options',
  'put',
  'delete',
])

/** Kechikishni amalga oshiruvchi funksiya turi (testlarda in'ektsiya uchun). */
export type DelayFn = (ms: number) => Promise<void>

/** Standart (real vaqt) kechikish: `setTimeout` asosida. */
const defaultDelay: DelayFn = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

/** `attachRetryInterceptor` uchun ixtiyoriy sozlamalar. */
export interface AttachRetryOptions {
  /** Kechikishni amalga oshiruvchi funksiya (standart: `setTimeout`). */
  delay?: DelayFn
  /** Maksimal qayta urinishlar soni (standart: `MAX_5XX_RETRIES`). */
  maxRetries?: number
}

/** Qayta urinishlar sonini kuzatish uchun kengaytirilgan request konfiguratsiyasi. */
interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  /** Hozirgacha amalga oshirilgan qayta urinishlar soni. */
  __retryCount?: number
}

/** Xato 5xx (server) javobi sababli yuzaga kelganligini aniqlaydi. */
function isServerError(error: AxiosError): boolean {
  const status = error.response?.status
  return typeof status === 'number' && status >= 500 && status <= 599
}

/** So'rov metodi idempotent (qayta urilishi xavfsiz) ekanligini aniqlaydi. */
function isIdempotentRequest(config: RetryableRequestConfig): boolean {
  const method = config.method?.toLowerCase()
  return method !== undefined && IDEMPOTENT_METHODS.has(method)
}

/**
 * 5xx backoff retry interceptorini berilgan axios instance ga ulaydi.
 *
 * Interceptor faqat idempotent so'rovlarning 5xx javoblarini qayta uradi.
 * Har bir qayta urinishdan oldin `compute5xxRetryDelay(attempt)` orqali
 * hisoblangan kechikish (`[300, 900, 2700]` ms) qo'llaniladi. `maxRetries`
 * urinishdan keyin oxirgi xato chaqiruvchiga uzatiladi.
 *
 * @returns o'rnatilgan interceptor identifikatori (`eject` uchun ishlatilishi mumkin).
 */
export function attachRetryInterceptor(
  client: AxiosInstance,
  options: AttachRetryOptions = {},
): number {
  const delay = options.delay ?? defaultDelay
  const maxRetries = options.maxRetries ?? MAX_5XX_RETRIES

  return client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = error.config as RetryableRequestConfig | undefined

      // Konfiguratsiya yo'q, server xatosi emas yoki idempotent bo'lmagan
      // so'rovlar qayta urilmaydi — xato darhol yuqoriga uzatiladi.
      if (
        config === undefined ||
        !isServerError(error) ||
        !isIdempotentRequest(config)
      ) {
        return Promise.reject(error)
      }

      const attempt = config.__retryCount ?? 0

      // Barcha qayta urinishlar tugagan — oxirgi xato yuqoriga uzatiladi.
      if (attempt >= maxRetries) {
        return Promise.reject(error)
      }

      // Keyingi urinishni belgilaymiz va jadval bo'yicha kechikamiz.
      config.__retryCount = attempt + 1
      await delay(compute5xxRetryDelay(attempt))

      return client.request(config)
    },
  )
}

export default attachRetryInterceptor
