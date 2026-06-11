// Til tanlash komponenti (Header ichida) — Req 19.2.
//
// Tanlangan til `ui-store` (locale) va i18next ga sinxron tarzda o'rnatiladi,
// hamda `setLanguage` orqali localStorage ga saqlanadi. Til o'zgartirilganda
// sahifa qayta yuklanmaydi — react-i18next reaktiv yangilanadi.
//
// Qulaylik (Req 20.3, 20.4): nativ `<select>` to'liq klaviatura navigatsiyasi
// va fokus indikatorini ta'minlaydi; `aria-label` ekran o'qigichlar uchun
// elementni tushuntiradi.

import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

import i18n from "@/shared/i18n/config";
import { setLanguage } from "@/shared/i18n/language";
import { useUiStore } from "@/shared/store/ui-store";
import type { Locale } from "@/shared/types";

/** Qo'llab-quvvatlanadigan tillar va ularning ko'rinadigan nomlari. */
const LOCALE_OPTIONS: { value: Locale; label: string }[] = [
  { value: "uz", label: "O'zbekcha" },
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
];

/**
 * Til tanlash dropdown'i. Tanlov global UI holatiga, i18next ga va
 * localStorage ga yoziladi.
 */
export function LanguageSelector() {
  const { t } = useTranslation();
  const locale = useUiStore((state) => state.locale);
  const setLocale = useUiStore((state) => state.setLocale);

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value as Locale;
    setLocale(next);
    setLanguage(next);
    void i18n.changeLanguage(next);
  }

  return (
    <label className="relative inline-flex items-center">
      <Globe
        className="pointer-events-none absolute left-2 h-4 w-4 text-muted-foreground"
        aria-hidden="true"
      />
      <span className="sr-only">{t("layout.selectLanguage")}</span>
      <select
        value={locale}
        onChange={handleChange}
        aria-label={t("layout.selectLanguage")}
        className="h-9 appearance-none rounded-md border border-input bg-background pl-8 pr-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {LOCALE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
