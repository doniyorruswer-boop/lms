// i18next konfiguratsiyasi (Req 19.1, 19.5).
//
// - Qo'llab-quvvatlanadigan tillar: uz (boshlang'ich), ru, en.
// - Boshlang'ich til `resolveInitialLanguage(loadLanguage(), navigator.language)`
//   orqali hal qilinadi: saqlangan tanlov → brauzer tili → 'uz'.
// - Tarjima kaliti topilmasa, uz fallback ishlaydi (fallbackLng).

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { DEFAULT_LOCALE, type Locale } from "@/shared/types";

import { loadLanguage, resolveInitialLanguage } from "./language";
import en from "./locales/en.json";
import ru from "./locales/ru.json";
import uz from "./locales/uz.json";

/** i18next resurslari — har bir til uchun `translation` namespace. */
export const resources = {
  uz: { translation: uz },
  ru: { translation: ru },
  en: { translation: en },
} as const;

/**
 * Brauzer tilini xavfsiz o'qiydi. SSR yoki `navigator` mavjud bo'lmagan
 * muhitda `null` qaytaradi.
 */
function getBrowserLanguage(): string | null {
  if (typeof navigator === "undefined") {
    return null;
  }
  // `navigator.language` "en-US" kabi bo'lishi mumkin — faqat asosiy qismni olamiz.
  return navigator.language?.split("-")[0] ?? null;
}

/** Boshlang'ich tilni saqlangan tanlov va brauzer tili asosida hal qiladi. */
export function getInitialLanguage(): Locale {
  return resolveInitialLanguage(loadLanguage(), getBrowserLanguage());
}

void i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: ["uz", "ru", "en"],
  interpolation: {
    escapeValue: false, // React XSS dan o'zi himoya qiladi.
  },
});

export default i18n;
