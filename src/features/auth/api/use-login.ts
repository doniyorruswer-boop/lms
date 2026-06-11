// Auth mutatsiya hooklari: login, OneID callback va logout (Req 1.2, 1.5, 1.8).
//
// React Query 5 `useMutation` orqali autentifikatsiya yon-effektlari
// (network so'rov, sessiya o'rnatish, navigatsiya) markazlashtiriladi.
//
//   - `useLogin`        — login/parol → JWT olish/saqlash → rolga yo'naltirish
//   - `useOneIdCallback`— OneID `code` → JWT olish/saqlash → rolga yo'naltirish
//   - `useLogout`       — backend logout → mahalliy tokenlarni tozalash → /login

import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { LOGIN_PATH, parseRedirectParam } from "@/shared/auth/redirect";
import { startPathForRole } from "@/shared/auth/rbac";
import { useAuthStore } from "@/shared/store/auth-store";

import type { LoginFormValues } from "../login-schema";
import {
  loginRequest,
  logoutRequest,
  oneIdCallbackRequest,
  type AuthResponse,
} from "./auth-api";

/**
 * `redirect` parametri qiymati xavfsiz ichki yo'l ekanligini tekshiradi.
 *
 * Faqat bitta `/` bilan boshlanadigan nisbiy yo'llarga ruxsat beriladi;
 * `//evil.com` kabi protokol-nisbiy (open-redirect) qiymatlar yoki to'liq
 * URL lar rad etiladi — bu ochiq yo'naltirish zaifligini oldini oladi.
 */
function isSafeRedirectPath(path: string | null): path is string {
  return path !== null && path.startsWith("/") && !path.startsWith("//");
}

/**
 * Autentifikatsiyadan so'ng yo'naltiriladigan manzilni hal qiladi: agar joriy
 * URL da xavfsiz `redirect` parametri bo'lsa — o'sha yo'l, aks holda rolga mos
 * boshlang'ich sahifa (Req 1.2, 2.2–2.5, 2.7).
 */
function resolvePostAuthTarget(data: AuthResponse): string {
  const redirect = parseRedirectParam(window.location.search);
  if (isSafeRedirectPath(redirect)) {
    return redirect;
  }
  return startPathForRole(data.user.role);
}

/**
 * Login/parol bilan kirish mutatsiyasi (Req 1.2).
 *
 * Muvaffaqiyatda: sessiyani o'rnatadi (profil + tokenlar `localStorage` ga
 * saqlanadi) va foydalanuvchini `redirect` parametri yoki rolga mos
 * boshlang'ich sahifaga yo'naltiradi. Xato (mas. 401) yuqoriga uzatiladi —
 * `LoginPage` uni ushlab xato xabarini ko'rsatadi va parol maydonini tozalaydi.
 */
export function useLogin(): UseMutationResult<
  AuthResponse,
  unknown,
  LoginFormValues
> {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      setSession(data.user, data.tokens);
      navigate(resolvePostAuthTarget(data), { replace: true });
    },
  });
}

/**
 * OneID OAuth callback mutatsiyasi (Req 1.5).
 *
 * Avtorizatsiya `code` ni backendga yuboradi, qaytgan JWT tokenlarni saqlaydi
 * va foydalanuvchini rolga mos sahifaga yo'naltiradi.
 */
export function useOneIdCallback(): UseMutationResult<
  AuthResponse,
  unknown,
  string
> {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: oneIdCallbackRequest,
    onSuccess: (data) => {
      setSession(data.user, data.tokens);
      navigate(resolvePostAuthTarget(data), { replace: true });
    },
  });
}

/**
 * Logout mutatsiyasi (Req 1.8).
 *
 * Backend logout endpointiga so'rov yuboradi. So'rov muvaffaqiyatli bo'ladimi
 * yoki xato qaytaradimi (`onSettled`), mahalliy sessiya doimo tozalanadi va
 * foydalanuvchi login sahifasiga yo'naltiriladi — token serverda bekor qilina
 * olmasa ham mijozda autentifikatsiya holati qoldirilmaydi.
 */
export function useLogout(): UseMutationResult<void, unknown, void> {
  const navigate = useNavigate();
  const clearSession = useAuthStore((state) => state.clearSession);

  return useMutation({
    mutationFn: logoutRequest,
    onSettled: () => {
      clearSession();
      navigate(LOGIN_PATH, { replace: true });
    },
  });
}
