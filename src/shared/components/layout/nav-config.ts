// Rolga asoslangan navigatsiya konfiguratsiyasi (Sidebar uchun).
//
// Har bir rol o'z panelining (prefiksi `rbac.ts` dagi `routePolicies` ga mos)
// menyu havolalarini e'lon qiladi. Bu deklarativ ro'yxat Sidebar tomonidan
// foydalanuvchi roliga qarab tegishli havolalarni ko'rsatish uchun ishlatiladi.
//
// `labelKey` — react-i18next tarjima kaliti (`nav.*`), shu sababli menyu
// yorliqlari tanlangan tilga mos ravishda ko'rsatiladi (Req 19.2).

import {
  Award,
  BarChart3,
  BookOpen,
  CalendarCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  MessageSquareWarning,
  RefreshCw,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { Role } from "@/shared/types";

/** Sidebar dagi bitta navigatsiya havolasi. */
export interface NavItem {
  /** Marshrut yo'li (absolyut). */
  to: string;
  /** react-i18next tarjima kaliti (mas. "nav.dashboard"). */
  labelKey: string;
  /** Havola yonida ko'rsatiladigan ikonka. */
  icon: LucideIcon;
}

/**
 * Rol → navigatsiya havolalari moslashuvi (Req 19.2, 20.2).
 *
 * Yo'l prefikslari `rbac.ts` dagi `routePolicies` bilan mos keladi:
 *   - STUDENT     → /student/*
 *   - TEACHER     → /teacher/*
 *   - OTM_ADMIN,
 *     DEKAN       → /admin/*
 *   - SUPER_ADMIN → /monitoring/*
 */
export const NAV_ITEMS_BY_ROLE: Record<Role, NavItem[]> = {
  STUDENT: [
    { to: "/student/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
    { to: "/student/courses", labelKey: "nav.courses", icon: BookOpen },
    { to: "/student/tests", labelKey: "nav.tests", icon: FileText },
    { to: "/student/attendance", labelKey: "nav.attendance", icon: CalendarCheck },
    { to: "/student/certificates", labelKey: "nav.certificates", icon: Award },
    { to: "/student/complaints", labelKey: "nav.complaints", icon: MessageSquareWarning },
  ],
  TEACHER: [
    { to: "/teacher/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
    { to: "/teacher/courses", labelKey: "nav.courses", icon: BookOpen },
    { to: "/teacher/grading", labelKey: "nav.grading", icon: GraduationCap },
    { to: "/teacher/attendance", labelKey: "nav.attendance", icon: CalendarCheck },
  ],
  OTM_ADMIN: [
    { to: "/admin/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
    { to: "/admin/users", labelKey: "nav.users", icon: Users },
    { to: "/admin/courses", labelKey: "nav.courses", icon: BookOpen },
    { to: "/admin/reports", labelKey: "nav.reports", icon: BarChart3 },
    { to: "/admin/complaints", labelKey: "nav.complaints", icon: MessageSquareWarning },
    { to: "/admin/sync", labelKey: "nav.sync", icon: RefreshCw },
  ],
  DEKAN: [
    { to: "/admin/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
    { to: "/admin/users", labelKey: "nav.users", icon: Users },
    { to: "/admin/courses", labelKey: "nav.courses", icon: BookOpen },
    { to: "/admin/reports", labelKey: "nav.reports", icon: BarChart3 },
    { to: "/admin/complaints", labelKey: "nav.complaints", icon: MessageSquareWarning },
  ],
  SUPER_ADMIN: [
    { to: "/monitoring/dashboard", labelKey: "nav.monitoring", icon: BarChart3 },
    { to: "/monitoring/reports", labelKey: "nav.reports", icon: FileText },
    { to: "/monitoring/complaints", labelKey: "nav.complaints", icon: MessageSquareWarning },
  ],
};

/**
 * Berilgan rol uchun navigatsiya havolalarini qaytaradi.
 *
 * @param role Foydalanuvchi roli, autentifikatsiyadan o'tmagan bo'lsa `null`.
 * @returns Rolga mos havolalar ro'yxati; rol berilmasa bo'sh ro'yxat.
 */
export function navItemsForRole(role: Role | null | undefined): NavItem[] {
  if (!role) return [];
  return NAV_ITEMS_BY_ROLE[role];
}
