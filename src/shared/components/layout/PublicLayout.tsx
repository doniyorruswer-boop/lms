// Ommaviy (autentifikatsiyasiz) sahifalar uchun layout — Login, OneID callback.
//
// Sodda markazlashtirilgan ramka: til tanlash imkoniyati bilan minimal sarlavha
// va sahifa kontenti uchun `<Outlet />`. Sidebar yoki himoyalangan elementlar
// ko'rsatilmaydi.

import { Outlet } from "react-router-dom";

import { LanguageSelector } from "./LanguageSelector";

/**
 * Ommaviy sahifalar uchun ramka (header'da faqat til tanlash + Outlet).
 */
export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex h-16 items-center border-b border-border px-4">
        <span className="text-lg font-semibold">LMS</span>
        <div className="ml-auto">
          <LanguageSelector />
        </div>
      </header>
      <main id="main-content" className="flex flex-1 items-center justify-center p-4">
        <Outlet />
      </main>
    </div>
  );
}
