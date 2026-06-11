// Rolga asoslangan yon panel (Sidebar) — Req 20.2, 20.3, 20.4.
//
// Havolalar `nav-config.ts` dagi `navItemsForRole` orqali foydalanuvchi roliga
// qarab hosil qilinadi. Desktopda (>= 768px) doimo ko'rinadi; mobilda esa
// gamburger orqali ochiladigan overlay sifatida ishlaydi.
//
// Qulaylik:
//   - `<nav aria-label>` — navigatsiya mintaqasini belgilaydi (Req 20.3).
//   - `NavLink` klaviatura fokusi va faol holatini ta'minlaydi (Req 20.3, 20.4).
//   - Har bir ikonka `aria-hidden`, yorliq matni esa ko'rinadigan label.

import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { cn } from "@/shared/lib/utils";
import type { Role } from "@/shared/types";

import { navItemsForRole } from "./nav-config";

export interface SidebarProps {
  /** Joriy foydalanuvchi roli (menyu havolalarini aniqlaydi). */
  role: Role | null | undefined;
  /** Mobil ko'rinishda panel ochiqligini bildiradi. */
  open: boolean;
  /** Mobil havola bosilganda yoki overlay yopilganda chaqiriladi. */
  onNavigate: () => void;
}

/**
 * Rolga mos navigatsiya havolalarini ko'rsatuvchi yon panel.
 */
export function Sidebar({ role, open, onNavigate }: SidebarProps) {
  const { t } = useTranslation();
  const items = navItemsForRole(role);

  return (
    <>
      {/* Mobil overlay — panel ochiq bo'lganda fonni qoraytiradi. */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          aria-hidden="true"
          onClick={onNavigate}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform border-r border-border bg-background transition-transform duration-200 ease-in-out md:static md:z-auto md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center border-b border-border px-4">
          <span className="text-lg font-semibold">LMS</span>
        </div>
        <nav aria-label={t("layout.mainNavigation")} className="p-2">
          <ul className="flex flex-col gap-1">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      )
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{t(item.labelKey)}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
