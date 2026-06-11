// Administrator boshqaruv paneli (Req 18).
//
// Admin panelining asosiy bo'limlariga (foydalanuvchilar, kurslar, hisobotlar,
// shikoyatlar, HEMIS sinxronizatsiyasi) tezkor kirish kartochkalarini
// ko'rsatadi. Bo'limlar foydalanuvchi roliga (OTM_ADMIN/DEKAN) qarab Sidebar
// orqali ham mavjud; bu sahifa ularni bitta joyda jamlaydi.

import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  MessageSquareWarning,
  RefreshCw,
  Users,
  type LucideIcon,
} from "lucide-react";

import { useAuthStore } from "@/shared/store/auth-store";
import { Card, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

interface AdminLink {
  to: string;
  labelKey: string;
  icon: LucideIcon;
  /** Faqat OTM_ADMIN uchun (DEKAN da yashiriladi). */
  otmAdminOnly?: boolean;
}

const ADMIN_LINKS: AdminLink[] = [
  { to: "/admin/users", labelKey: "nav.users", icon: Users },
  { to: "/admin/courses", labelKey: "nav.courses", icon: BookOpen },
  { to: "/admin/reports", labelKey: "nav.reports", icon: BarChart3 },
  { to: "/admin/complaints", labelKey: "nav.complaints", icon: MessageSquareWarning },
  { to: "/admin/sync", labelKey: "nav.sync", icon: RefreshCw, otmAdminOnly: true },
];

/**
 * Administrator paneli bosh sahifasi — bo'limlarga tezkor kirish.
 */
export function AdminDashboardPage() {
  const { t } = useTranslation();
  const role = useAuthStore((state) => state.user?.role);

  const links = ADMIN_LINKS.filter(
    (link) => !link.otmAdminOnly || role === "OTM_ADMIN",
  );

  return (
    <main className="space-y-6 p-6" aria-labelledby="admin-dashboard-title">
      <h1 id="admin-dashboard-title" className="text-2xl font-bold">
        {t("nav.dashboard")}
      </h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Card className="h-full transition-colors hover:bg-accent">
                <CardHeader className="flex-row items-center gap-3 space-y-0">
                  <Icon className="size-6 text-primary" aria-hidden="true" />
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{t(link.labelKey)}</CardTitle>
                    <CardDescription>
                      {t(`admin.dashboard.open`, "Bo'limni ochish")}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </main>
  );
}

export default AdminDashboardPage;
