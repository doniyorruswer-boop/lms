// Himoyalangan layout sarlavhasi (Header) — Req 19.2, 20.2, 20.3, 20.4.
//
// Tarkibi:
//   - Mobil (< 768px) uchun gamburger tugmasi — sidebar holatini almashtiradi.
//   - Til tanlash (LanguageSelector) — Req 19.2.
//   - Bildirishnomalar tugmasi — `notification-store` dagi o'qilmaganlar soni
//     bilan (unreadCount badge).
//   - Foydalanuvchi profili — `auth-store` dagi joriy foydalanuvchi.
//
// Barcha interaktiv elementlar `aria-label` ga ega va klaviatura orqali
// boshqariladi (Req 20.3, 20.4).

import { LogOut, Menu, UserCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/ui/button";
import { NotificationManager } from "@/features/notifications/components/notification-manager";
import { useLogout } from "@/features/auth";

import { LanguageSelector } from "./LanguageSelector";

export interface HeaderProps {
  /** Foydalanuvchining ko'rsatiladigan to'liq ismi. */
  userName?: string;
  /** Mobil gamburger tugmasi bosilganda chaqiriladi. */
  onMenuToggle: () => void;
}

/**
 * Himoyalangan panellar uchun yuqori sarlavha paneli.
 */
export function Header({ userName, onMenuToggle }: HeaderProps) {
  const { t } = useTranslation();
  const logout = useLogout();

  return (
    <header className="flex h-16 items-center gap-2 border-b border-border bg-background px-4">
      {/* Gamburger — faqat mobil (< md = 768px) ko'rinadi. */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label={t("layout.openMenu")}
        onClick={onMenuToggle}
      >
        <Menu aria-hidden="true" />
      </Button>

      <div className="ml-auto flex items-center gap-2">
        <LanguageSelector />

        {/* Bildirishnomalar — NotificationManager bilan to'liq integratsiya. */}
        <NotificationManager />

        {/* Foydalanuvchi profili. */}
        <Button
          type="button"
          variant="ghost"
          className="gap-2"
          aria-label={t("layout.userMenu")}
        >
          <UserCircle aria-hidden="true" />
          {userName && <span className="hidden text-sm font-medium sm:inline">{userName}</span>}
        </Button>

        {/* Chiqish (logout). */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("layout.logout")}
          title={t("layout.logout")}
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
        >
          <LogOut aria-hidden="true" />
        </Button>
      </div>
    </header>
  );
}
