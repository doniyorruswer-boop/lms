// Auth feature uchun backend API so'rov funksiyalari (Req 1.2, 1.5, 1.8).
//
// Bu modul Auth_Module ning transport qatlamini ifodalaydi: login/parol
// autentifikatsiyasi, OneID OAuth callback va logout uchun HTTP chaqiruvlari
// hamda OneID avtorizatsiya URL ini qurish. Barcha chaqiruvlar markazlashgan
// `apiClient` (JWT qo'shish, 401 refresh, 5xx retry interceptorlari bilan)
// orqali amalga oshadi.
//
// React Query mutatsiyalari (`use-login.ts`) shu funksiyalarni iste'mol qiladi.

import { API_BASE_URL, apiClient } from "@/shared/api/client";
import { endpoints } from "@/shared/api/endpoints";
import type { JwtTokens, UserProfile } from "@/shared/types";

import type { LoginFormValues } from "../login-schema";

/**
 * Login va OneID callback endpointlari qaytaradigan birlashgan javob.
 *
 * Backend autentifikatsiya muvaffaqiyatli bo'lganda foydalanuvchi profilini
 * va JWT tokenlar juftini birgalikda qaytaradi — shunda frontend qo'shimcha
 * `/auth/me` so'rovisiz sessiyani o'rnatib, rolga yo'naltira oladi.
 */
export interface AuthResponse {
  /** Autentifikatsiyadan o'tgan foydalanuvchi profili. */
  user: UserProfile;
  /** Access/refresh JWT tokenlar va amal qilish muddati. */
  tokens: JwtTokens;
}

/**
 * Login/parol bilan autentifikatsiya so'rovi (Req 1.2).
 *
 * @param credentials Foydalanuvchi nomi va parol.
 * @returns Foydalanuvchi profili va JWT tokenlar.
 */
export async function loginRequest(
  credentials: LoginFormValues,
): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>(
    endpoints.auth.login,
    credentials,
  );
  return response.data;
}

/**
 * OneID OAuth `code` ni backendga yuborib tokenlarni oladi (Req 1.5).
 *
 * @param code OneID callback URL dan kelgan avtorizatsiya kodi.
 * @returns Foydalanuvchi profili va JWT tokenlar.
 */
export async function oneIdCallbackRequest(
  code: string,
): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>(
    endpoints.auth.oneIdCallback,
    { code },
  );
  return response.data;
}

/**
 * Backend logout endpointiga so'rov yuboradi (Req 1.8).
 *
 * Mahalliy tokenlarni tozalash chaqiruvchi tomonda (`useLogout`) amalga
 * oshadi — bu funksiya faqat serverdagi sessiyani yopish bilan shug'ullanadi.
 */
export async function logoutRequest(): Promise<void> {
  await apiClient.post(endpoints.auth.logout);
}

/**
 * OneID OAuth avtorizatsiya oqimini boshlash uchun to'liq URL ni quradi
 * (Req 1.4).
 *
 * Brauzer shu URL ga yo'naltiriladi; backend `/auth/oneid/authorize` endpointi
 * foydalanuvchini OneID provayderiga (OAuth 2.0) qayta yo'naltiradi. URL
 * `apiClient` ning `baseURL` prefiksi (`/api/v1`) bilan birlashtiriladi.
 */
export function buildOneIdAuthorizeUrl(): string {
  return `${API_BASE_URL}${endpoints.auth.oneIdAuthorize}`;
}
