// ErrorBoundary uchun fallback UI (Req 18, 21.5).
//
// Funksional komponent — `react-i18next` orqali tarjima qilingan xato xabarini
// va "Qayta urinish" hamda "Boshiga qaytish" amallarini ko'rsatadi. App va
// panel darajalari uchun turli o'lcham/joylashuvga ega.

import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/shared/ui/button";

export interface ErrorBoundaryFallbackProps {
  /** Fallback darajasi (app = to'liq ekran, panel = sahifa ichi). */
  level: "app" | "panel";
  /** Ushlangan xato (faqat diagnostika uchun ko'rsatiladi). */
  error: Error | null;
  /** "Qayta urinish" bosilganda chegara holatini tiklaydi. */
  onReset: () => void;
}

/**
 * ErrorBoundary qulaganda ko'rsatiladigan foydalanuvchiga qulay xato ekrani.
 */
export function ErrorBoundaryFallback({
  level,
  error,
  onReset,
}: ErrorBoundaryFallbackProps) {
  const { t } = useTranslation();

  const containerClass =
    level === "app"
      ? "flex min-h-screen items-center justify-center bg-background p-6"
      : "flex min-h-[50vh] items-center justify-center p-6";

  return (
    <div className={containerClass} role="alert">
      <div className="w-full max-w-md space-y-4 rounded-lg border border-destructive/50 bg-card p-6 text-center">
        <div className="flex justify-center">
          <AlertTriangle className="size-10 text-destructive" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold text-destructive">
          {t("errorBoundary.title", "Kutilmagan xatolik yuz berdi")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t(
            "errorBoundary.description",
            "Sahifani ko'rsatishda muammo yuzaga keldi. Iltimos, qayta urinib ko'ring.",
          )}
        </p>
        {error?.message ? (
          <pre className="max-h-32 overflow-auto rounded bg-muted p-2 text-left text-xs text-muted-foreground">
            {error.message}
          </pre>
        ) : null}
        <div className="flex justify-center gap-2">
          <Button onClick={onReset} variant="outline">
            {t("errorBoundary.retry", "Qayta urinish")}
          </Button>
          <Button onClick={() => (window.location.href = "/")}>
            {t("errorBoundary.home", "Boshiga qaytish")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ErrorBoundaryFallback;
