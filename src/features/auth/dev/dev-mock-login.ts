// DEV-ONLY: Vaqtinchalik mock login (backend tayyor bo'lmaganda sinash uchun).
//
// Bu modul faqat `import.meta.env.DEV` rejimida ishlatiladi va backendga
// murojaat qilmasdan soxta sessiya o'rnatadi. Har bir rol uchun oldindan
// tayyorlangan profil bilan tegishli panelga (student/teacher/admin/...)
// to'g'ridan-to'g'ri kirish imkonini beradi.
//
// ⚠️ PRODUCTION da ishlatilmaydi — `LoginRoute` uni `import.meta.env.DEV`
//    sharti bilan o'raydi. Backend auth oqimi ulangach bu modul olib tashlanishi
//    yoki o'chirilishi mumkin.

import { useNavigate } from "react-router-dom";

import { startPathForRole } from "@/shared/auth/rbac";
import { useAuthStore } from "@/shared/store/auth-store";
import type { JwtTokens, Role, UserProfile } from "@/shared/types";

/** Soxta token amal qilish muddati: hozirdan 24 soat. */
const MOCK_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

/** Har bir rol uchun oldindan tayyorlangan dev foydalanuvchi profili. */
export const DEV_MOCK_USERS: Record<Role, UserProfile> = {
  STUDENT: {
    id: "dev-student",
    fullName: "Dev Student",
    role: "STUDENT",
    otmId: "dev-otm",
    facultyId: "dev-faculty",
    email: "student@dev.local",
    avatarUrl: null,
  },
  TEACHER: {
    id: "dev-teacher",
    fullName: "Dev Teacher",
    role: "TEACHER",
    otmId: "dev-otm",
    facultyId: "dev-faculty",
    email: "teacher@dev.local",
    avatarUrl: null,
  },
  OTM_ADMIN: {
    id: "dev-otm-admin",
    fullName: "Dev OTM Admin",
    role: "OTM_ADMIN",
    otmId: "dev-otm",
    facultyId: null,
    email: "otm-admin@dev.local",
    avatarUrl: null,
  },
  DEKAN: {
    id: "dev-dekan",
    fullName: "Dev Dekan",
    role: "DEKAN",
    otmId: "dev-otm",
    facultyId: "dev-faculty",
    email: "dekan@dev.local",
    avatarUrl: null,
  },
  SUPER_ADMIN: {
    id: "dev-super-admin",
    fullName: "Dev Super Admin",
    role: "SUPER_ADMIN",
    otmId: null,
    facultyId: null,
    email: "super-admin@dev.local",
    avatarUrl: null,
  },
};

/** Berilgan rol uchun soxta JWT tokenlar yaratadi. */
function createMockTokens(role: Role): JwtTokens {
  return {
    accessToken: `dev-mock-access-${role}`,
    refreshToken: `dev-mock-refresh-${role}`,
    expiresAt: Date.now() + MOCK_TOKEN_TTL_MS,
  };
}

/**
 * Dev mock login hook-i.
 *
 * Qaytarilgan funksiya tanlangan rol uchun soxta sessiyani store-ga
 * o'rnatadi va foydalanuvchini rolga mos boshlang'ich sahifaga yo'naltiradi —
 * backendga hech qanday so'rov yuborilmaydi.
 */
export function useDevMockLogin(): (role: Role) => void {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);

  return (role: Role) => {
    setSession(DEV_MOCK_USERS[role], createMockTokens(role));
    navigate(startPathForRole(role), { replace: true });
  };
}
