// Til (locale) hal qilish va saqlash uchun toza helperlar.
// Side-effectlar faqat localStorage bilan ishlash bilan cheklangan; hal qilish
// logikasi (resolveInitialLanguage) toza funksiya bo'lib, PBT uchun mos.

import { DEFAULT_LOCALE, type Locale } from "@/shared/types";

/** Tanlangan til saqlanadigan localStorage kaliti. */
export const LANGUAGE_STORAGE_KEY = "lms.language";

/** Qo'llab-quvvatlanadigan tillar to'plami. */
const SUPPORTED_LOCALES: readonly Locale[] = ["uz", "ru", "en"];

/** Berilgan qiymat qo'llab-quvvatlanadigan Locale ekanligini tekshiradi (type guard). */
function isLocale(value: string | null | undefined): value is Locale {
  return value != null && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * Boshlang'ich tilni hal qiladi (Property 25 — til fallback qoidasi):
 * 1. `stored` qo'llab-quvvatlanadigan tillar to'plamida bo'lsa — `stored`.
 * 2. Aks holda `browser` ushbu to'plamga tushsa — `browser`.
 * 3. Aks holda boshlang'ich til (`'uz'`).
 */
export function resolveInitialLanguage(
  stored: string | null | undefined,
  browser: string | null | undefined,
): Locale {
  if (isLocale(stored)) {
    return stored;
  }
  if (isLocale(browser)) {
    return browser;
  }
  return DEFAULT_LOCALE;
}

/** Tanlangan tilni `localStorage` ga saqlaydi (Req 19.4). */
export function setLanguage(lang: Locale): void {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // localStorage mavjud bo'lmasa (masalan, SSR yoki cheklangan muhit) jim o'tkazib yuboriladi.
  }
}

/**
 * Saqlangan tilni `localStorage` dan o'qiydi (Property 24 — round-trip).
 * Saqlangan qiymat yo'q yoki noto'g'ri bo'lsa `null` qaytaradi.
 */
export function loadLanguage(): Locale | null {
  try {
    const value = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isLocale(value) ? value : null;
  } catch {
    return null;
  }
}
