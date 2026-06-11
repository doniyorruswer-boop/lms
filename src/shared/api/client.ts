// Markazlashtirilgan Axios instance (API_Client transport qatlami).
//
// Barcha so'rovlar `/api/v1` prefiksiga yuboriladi (Req 21.1) va 30 soniya
// timeout bilan cheklanadi. Bu modul ATAYLAB faqat instance yaratish va
// eksport qilishga e'tibor qaratadi — JWT qo'shish (auth-interceptor),
// 5xx backoff retry (retry) va 401 single-flight refresh interceptorlari
// keyingi vazifalarda (10.3 / 10.5 / 10.7) shu eksport qilingan instance ga
// ulanadi.

import axios, { type AxiosInstance } from 'axios'

/** API_Client uchun asosiy yo'l prefiksi (Req 21.1). */
export const API_BASE_URL = '/api/v1'

/** So'rov timeout chegarasi (millisekund). */
export const API_TIMEOUT_MS = 30_000

/**
 * Ilova bo'ylab qayta ishlatiladigan yagona (singleton) Axios instance.
 *
 * Interceptorlar shu instance ga keyinroq ulanadi; shu sababli u alohida
 * eksport qilinadi va boshqa modullar (auth-interceptor, retry) uni import
 * qilib `interceptors.request` / `interceptors.response` ga qo'shilishi
 * mumkin.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
})

export default apiClient
