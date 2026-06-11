// OneID OAuth callback sahifasi (Req 1.5).
//
// OneID provayderi foydalanuvchini `?code=...` parametri bilan shu sahifaga
// qaytaradi. Komponent kodni backendga yuboradi (`useOneIdCallback`), qaytgan
// JWT tokenlarni saqlaydi va rolga mos sahifaga yo'naltiradi.
//
// Holatlar:
//   - kod yo'q          → xato xabari + login sahifasiga qaytish havolasi
//   - yuborilmoqda      → yuklash indikatori
//   - backend xatosi    → xato xabari + qayta urinish/login havolasi

import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";

import { LOGIN_PATH } from "@/shared/auth/redirect";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

import { useOneIdCallback } from "./api/use-login";

/**
 * OneID callback ni qayta ishlovchi sahifa. URL dagi `code` ni backendga
 * yuborib sessiyani o'rnatadi va foydalanuvchini yo'naltiradi.
 */
export function OneIDCallback() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
  const callback = useOneIdCallback();

  // Kod bilan callback ni faqat bir marta ishga tushiramiz (StrictMode/qayta
  // renderlarda takroriy yuborilishini oldini olamiz).
  const submittedRef = useRef(false);
  const { mutate } = callback;
  useEffect(() => {
    if (code && !submittedRef.current) {
      submittedRef.current = true;
      mutate(code);
    }
  }, [code, mutate]);

  const hasError = !code || callback.isError;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm p-6 text-center">
        {hasError ? (
          <div className="space-y-4">
            <p role="alert" className="text-sm text-destructive">
              {code ? t("login.oneIdError") : t("login.oneIdMissingCode")}
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to={LOGIN_PATH}>{t("login.backToLogin")}</Link>
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("login.oneIdProcessing")}
          </p>
        )}
      </Card>
    </div>
  );
}
