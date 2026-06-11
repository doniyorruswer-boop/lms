// Himoyalangan panellar uchun asosiy layout — Req 20.2, 20.3, 20.4.
//
// Tuzilishi: rolga asoslangan Sidebar + Header (til, bildirishnoma, profil) +
// sahifa kontenti uchun `<Outlet />`. Mobilda (< 768px) Sidebar gamburger
// menyu orqali ochiladigan overlayga aylanadi; sidebar holati `ui-store`
// orqali boshqariladi.
//
// Holat manbalari:
//   - auth-store        → foydalanuvchi (rol, ism)
//   - ui-store          → sidebar ochiqligi

import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { type ReactNode } from "react";

import { useAuthStore } from "@/shared/store/auth-store";
import { useUiStore } from "@/shared/store/ui-store";

import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export interface ProtectedLayoutProps {
  /**
   * Outlet o'rniga render qilinadigan kontent. Berilmasa standart `<Outlet />`
   * ishlatiladi. Router bu orqali panel darajasidagi ErrorBoundary ni
   * Outlet atrofiga o'raydi (Req 18, 21.5).
   */
  children?: ReactNode;
}

/**
 * Autentifikatsiyadan o'tgan foydalanuvchilar uchun ramka (Header + Sidebar + Outlet).
 */
export function ProtectedLayout({ children }: ProtectedLayoutProps = {}) {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Klaviatura foydalanuvchilari uchun kontentga to'g'ridan-to'g'ri o'tish (Req 20.3). */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:ring-2 focus:ring-ring"
      >
        {t("layout.skipToContent")}
      </a>

      <Sidebar
        role={user?.role}
        open={sidebarOpen}
        onNavigate={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          userName={user?.fullName}
          onMenuToggle={toggleSidebar}
        />
        <main id="main-content" className="flex-1 overflow-auto p-4">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
