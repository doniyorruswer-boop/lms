// 403 — "Ruxsat yo'q" sahifasi (Req 2.6).
//
// Foydalanuvchi o'z rolida ruxsat etilmagan URL ga kirishga harakat qilganda
// `/forbidden` marshrutida ko'rsatiladi. Matnlar `react-i18next` orqali
// tarjima qilinadi (uz/ru/en).
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/ui/button";

/**
 * 403 Forbidden sahifasi. Rolga ruxsat etilmagan marshrutga urinishda
 * `Routing_Module` tomonidan render qilinadi (Req 2.6).
 */
export function ForbiddenPage() {
  const { t } = useTranslation();

  return (
    <main
      role="main"
      className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center"
    >
      <h1 className="text-3xl font-bold text-destructive">
        {t("forbidden.title")}
      </h1>
      <p className="max-w-md text-muted-foreground">
        {t("forbidden.description")}
      </p>
      <Button asChild variant="outline">
        <a href="/">{t("forbidden.back")}</a>
      </Button>
    </main>
  );
}

export default ForbiddenPage;
