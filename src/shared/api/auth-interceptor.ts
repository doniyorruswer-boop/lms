// Autentifikatsiya interceptorlari (API_Client auth qatlami).
//
// Ushbu modul Axios so'rovlariga JWT_Token ni avtomatik qo'shish bilan
// shug'ullanadi (Req 21.2 — Property 27). Kelajakda (vazifa 10.7) shu faylga
// 401 javoblar uchun single-flight refresh handler ham qo'shiladi; shu sababli
// `authHeaderInterceptor` alohida, sof (pure) named funksiya sifatida eksport
// qilinadi va uni Axios instance ga ulovchi yordamchi (`attachAuthHeaderInterceptor`)
// ham ajratilgan — bu qo'shimchalarni minimal o'zgarish bilan kiritishga imkon beradi.

import type {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios'

/**
 * Joriy access token ni qaytaruvchi funksiya tipi.
 *
 * Token mavjud bo'lmaganda `null` (yoki bo'sh satr) qaytarilishi mumkin.
 */
export type AccessTokenGetter = () => string | null

/**
 * Berilgan so'rov konfiguratsiyasiga `Authorization: Bearer <accessToken>`
 * sarlavhasini qo'shadi — faqat token mavjud bo'lganda (Property 27).
 *
 * Sarlavha QO'SHILADI if and only if `accessToken !== null && accessToken !== ''`.
 * Token bo'lmaganda (`null` yoki bo'sh satr) sarlavha o'zgartirilmaydi.
 *
 * Bu sof funksiya: u kelgan `config` obyektini mutatsiya qilib, o'sha obyektni
 * qaytaradi (Axios request interceptor shartnomasiga mos).
 *
 * @param config Axios so'rov konfiguratsiyasi.
 * @param accessToken Joriy access token yoki `null`.
 * @returns (mutatsiya qilingan) `config`.
 */
export function authHeaderInterceptor(
  config: InternalAxiosRequestConfig,
  accessToken: string | null,
): InternalAxiosRequestConfig {
  if (accessToken !== null && accessToken !== '') {
    config.headers.set('Authorization', `Bearer ${accessToken}`)
  }
  return config
}

/**
 * `authHeaderInterceptor` ni berilgan Axios instance ning request
 * interceptorlariga ulaydi. Token har bir so'rovda `getAccessToken` orqali
 * dinamik o'qiladi, shuning uchun token yangilanganda (refresh) keyingi
 * so'rovlar avtomatik yangi token bilan ketadi.
 *
 * @param instance Interceptor ulanadigan Axios instance.
 * @param getAccessToken Joriy access token ni qaytaruvchi funksiya.
 * @returns Axios interceptor identifikatori (kerak bo'lsa olib tashlash uchun).
 */
export function attachAuthHeaderInterceptor(
  instance: AxiosInstance,
  getAccessToken: AccessTokenGetter,
): number {
  return instance.interceptors.request.use((config) =>
    authHeaderInterceptor(config, getAccessToken()),
  )
}

// ---------------------------------------------------------------------------
// 401 single-flight refresh interceptori (Req 1.6, 1.7, 21.3)
//
// 401 Unauthorized javobida access token muddati tugagan deb hisoblanadi va
// `/auth/refresh` orqali yangi token olishga uriniladi. Bir vaqtning o'zida
// kelgan ko'p 401 lar uchun refresh so'rovi YAGONA marta yuboriladi
// (single-flight): birinchi 401 refresh promise ni yaratadi, qolgan parallel
// 401 lar shu promise ni kutadi. Refresh muvaffaqiyatli tugagach barcha asl
// so'rovlar yangi access token bilan qayta yuboriladi.
//
// See design.md "Property 5: Refresh-token singleton invariant" — N ≥ 1 ta
// parallel 401 uchun `/auth/refresh` chaqiruvi soni aniq 1 bo'ladi.
//
// Refresh muvaffaqiyatsiz bo'lsa (refresh token ham yaroqsiz/yo'q): tokenlar
// `tokenStorage.clear()` bilan tozalanadi va foydalanuvchi `buildLoginUrl`
// orqali qurilgan login URL ga yo'naltiriladi.

import { endpoints } from '@/shared/api/endpoints'
import { buildLoginUrl } from '@/shared/auth/redirect'
import { tokenStorage, type TokenStorage } from '@/shared/auth/token-storage'
import type { JwtTokens } from '@/shared/types'

/**
 * Refresh tokenni yangi `JwtTokens` ga almashtiruvchi funksiya turi.
 *
 * Standart implementatsiya `client.post('/auth/refresh', { refreshToken })`
 * ni chaqiradi; testlarda bu in'ektsiya qilinishi mumkin.
 */
export type RefreshTokensFn = (refreshToken: string | null) => Promise<JwtTokens>

/** Refresh muvaffaqiyatsiz bo'lganda login sahifasiga yo'naltiruvchi funksiya turi. */
export type RedirectToLoginFn = () => void

/** Qayta urinish holatini kuzatish uchun kengaytirilgan request konfiguratsiyasi. */
interface RefreshableRequestConfig extends InternalAxiosRequestConfig {
  /** Shu so'rov 401 dan so'ng allaqachon qayta urinilganligini bildiradi. */
  __refreshRetried?: boolean
}

/** `attachRefreshInterceptor` uchun ixtiyoriy sozlamalar. */
export interface AttachRefreshOptions {
  /** Yangi tokenlarni oluvchi funksiya (standart: `client.post('/auth/refresh')`). */
  refreshTokens?: RefreshTokensFn
  /** Refresh muvaffaqiyatsiz bo'lganda yo'naltirish (standart: `window.location`). */
  redirectToLogin?: RedirectToLoginFn
  /** Token saqlash qatlami (standart: umumiy `tokenStorage`). */
  storage?: TokenStorage
}

/**
 * Bir vaqtda kelgan 401 lar ulashadigan yagona (single-flight) refresh promise.
 *
 * `null` bo'lsa hozircha faol refresh yo'q. Birinchi 401 promise ni o'rnatadi;
 * refresh tugagach (muvaffaqiyat yoki xato) qayta `null` ga qaytariladi, shuning
 * uchun keyingi token muddati tugashi yangi refresh boshlashga imkon beradi.
 */
let refreshPromise: Promise<string> | null = null

/**
 * Single-flight refresh holatini tiklaydi (asosan testlar uchun).
 *
 * Faol refresh promise ga havolani tozalaydi, shuning uchun keyingi 401 yangi
 * refresh siklini boshlaydi.
 */
export function resetRefreshState(): void {
  refreshPromise = null
}

/**
 * Refreshni single-flight tarzda bajaradi: agar faol refresh bo'lmasa, uni
 * boshlaydi; aks holda mavjud promise ni qaytaradi. Shu sababli N ta parallel
 * 401 uchun haqiqiy refresh chaqiruvi aniq bir marta amalga oshadi.
 *
 * Refresh muvaffaqiyatsiz bo'lsa, tokenlar tozalanadi va login ga yo'naltiriladi
 * (faqat bir marta — chunki bu single-flight promise ichida bajariladi), so'ng
 * xato kutayotgan barcha chaqiruvchilarga uzatiladi.
 */
function runSingleFlightRefresh(
  refreshTokens: RefreshTokensFn,
  redirectToLogin: RedirectToLoginFn,
  storage: TokenStorage,
): Promise<string> {
  if (refreshPromise === null) {
    refreshPromise = (async () => {
      try {
        const tokens = await refreshTokens(storage.getRefreshToken())
        storage.setTokens(tokens)
        return tokens.accessToken
      } catch (error) {
        storage.clear()
        redirectToLogin()
        throw error
      }
    })().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

/** Standart login-redirect: joriy URL ni saqlab `buildLoginUrl` ga yo'naltiradi. */
function defaultRedirectToLogin(): void {
  if (typeof window === 'undefined') return
  const currentPath = `${window.location.pathname}${window.location.search}`
  window.location.assign(buildLoginUrl(currentPath))
}

/**
 * 401 single-flight refresh interceptorini berilgan axios instance ga ulaydi.
 *
 * Interceptor 401 javob kelganda yagona `/auth/refresh` chaqiruvi orqali yangi
 * access token oladi va asl so'rovni yangi token bilan qayta yuboradi. Bir
 * vaqtning o'zidagi ko'p 401 lar bitta refresh ni ulashadi (Property 5).
 *
 * Quyidagi hollarda refresh urinilmaydi va xato darhol yuqoriga uzatiladi:
 *  - request konfiguratsiyasi mavjud emas;
 *  - javob 401 emas;
 *  - bu allaqachon `/auth/refresh` so'rovi (cheksiz rekursiyani oldini olish);
 *  - so'rov 401 dan keyin allaqachon bir marta qayta urinilgan.
 *
 * @returns o'rnatilgan interceptor identifikatori (`eject` uchun ishlatilishi mumkin).
 */
export function attachRefreshInterceptor(
  client: AxiosInstance,
  options: AttachRefreshOptions = {},
): number {
  const storage = options.storage ?? tokenStorage
  const redirectToLogin = options.redirectToLogin ?? defaultRedirectToLogin
  const refreshTokens: RefreshTokensFn =
    options.refreshTokens ??
    ((refreshToken) =>
      client
        .post<JwtTokens>(endpoints.auth.refresh, { refreshToken })
        .then((response) => response.data))

  return client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = error.config as RefreshableRequestConfig | undefined

      const isUnauthorized = error.response?.status === 401
      const isRefreshRequest = config?.url === endpoints.auth.refresh

      // Refresh qo'llab bo'lmaydigan hollar — xato darhol uzatiladi.
      if (
        config === undefined ||
        !isUnauthorized ||
        isRefreshRequest ||
        config.__refreshRetried === true
      ) {
        return Promise.reject(error)
      }

      // Shu so'rovni qayta urinilgan deb belgilaymiz (takroriy 401 sikllarini oldini oladi).
      config.__refreshRetried = true

      const newAccessToken = await runSingleFlightRefresh(
        refreshTokens,
        redirectToLogin,
        storage,
      )

      // Asl so'rovni yangi access token bilan qayta yuboramiz.
      config.headers.set('Authorization', `Bearer ${newAccessToken}`)
      return client.request(config)
    },
  )
}
