// RBAC (Rolga asoslangan kirish nazorati) va boshlang'ich marshrut logikasi.
//
// Bu modul toza (pure), side-effect siz funksiyalardan iborat:
//   - `routePolicies`     — deklarativ path → ruxsat etilgan rollar konfiguratsiyasi (Req 2.8)
//   - `isRouteAllowed`    — eng aniq (most-specific) mos keluvchi siyosat asosida kirishni tekshirish (Req 2.6)
//   - `startPathForRole`  — rolga mos boshlang'ich URL (Req 2.2–2.5)
//
// Side-effect siz bo'lgani uchun xususiyatga asoslangan testlash (PBT) bilan to'liq qoplanadi
// (dizayn: Property 1 va Property 2).

import type { Role } from "../types";

/**
 * Bitta himoyalangan marshrut siyosati: path prefiksi va unga ruxsat etilgan rollar.
 */
export interface RoutePolicy {
  /** Marshrut path prefiksi (mas. "/student"). */
  path: string;
  /** Ushbu prefiksga (va uning ost-yo'llariga) kirishga ruxsat etilgan rollar. */
  allowedRoles: Role[];
}

/**
 * Deklarativ marshrut siyosatlari (Req 2.8).
 *
 * Har bir panel o'z prefiksi orqali ruxsat etilgan rollarni e'lon qiladi. Imperativ
 * tekshiruvlar tarqalmaydi — barcha kirish qoidalari shu yagona ro'yxatda joylashadi.
 *
 * Rol → panel moslashuvi:
 *   - STUDENT                → /student
 *   - TEACHER                → /teacher
 *   - OTM_ADMIN, DEKAN       → /admin
 *   - SUPER_ADMIN            → /monitoring
 */
export const routePolicies: RoutePolicy[] = [
  { path: "/student", allowedRoles: ["STUDENT"] },
  { path: "/teacher", allowedRoles: ["TEACHER"] },
  { path: "/admin", allowedRoles: ["OTM_ADMIN", "DEKAN"] },
  { path: "/monitoring", allowedRoles: ["SUPER_ADMIN"] },
];

/**
 * Rol → boshlang'ich URL moslashuvi (Req 2.2–2.5).
 */
const START_PATH_BY_ROLE: Record<Role, string> = {
  STUDENT: "/student/dashboard",
  TEACHER: "/teacher/dashboard",
  OTM_ADMIN: "/admin/dashboard",
  DEKAN: "/admin/dashboard",
  SUPER_ADMIN: "/monitoring/dashboard",
};

/**
 * Rolga mos boshlang'ich (login keyin yo'naltiriladigan) URL ni qaytaradi.
 *
 * @param role Foydalanuvchi roli.
 * @returns Rolga mos boshlang'ich URL.
 */
export function startPathForRole(role: Role): string {
  return START_PATH_BY_ROLE[role];
}

/**
 * Berilgan `pathname` ushbu `policy` ga mos kelishini tekshiradi.
 *
 * Mos kelish qoidasi: `pathname` aniq `policy.path` ga teng bo'lsa yoki uning ost-yo'li
 * bo'lsa (`policy.path` + "/" bilan boshlansa) mos keladi. Bu segment chegarasiga
 * asoslanadi — masalan "/admin" siyosati "/administrators" ga mos kelmaydi.
 */
function policyMatches(policy: RoutePolicy, pathname: string): boolean {
  return pathname === policy.path || pathname.startsWith(`${policy.path}/`);
}

/**
 * `pathname` uchun eng aniq (eng uzun mos prefiksli) siyosatni topadi.
 *
 * @returns Mos siyosat yoki hech biri mos kelmasa `undefined`.
 */
function findMostSpecificPolicy(pathname: string): RoutePolicy | undefined {
  let best: RoutePolicy | undefined;
  for (const policy of routePolicies) {
    if (policyMatches(policy, pathname) && (!best || policy.path.length > best.path.length)) {
      best = policy;
    }
  }
  return best;
}

/**
 * Berilgan `role` ning `pathname` ga kirishi ruxsat etilganligini tekshiradi (Req 2.6, 2.8).
 *
 * `pathname` ning eng aniq mos keluvchi siyosati aniqlanadi; agar shu siyosat `role` ni
 * o'z ichiga olsa `true`, aks holda `false` qaytariladi. Hech qanday siyosat mos kelmasa
 * (deklaratsiya qilinmagan marshrut) standart sifatida `false` (deny-by-default) qaytariladi.
 *
 * @param pathname Tekshirilayotgan URL pathi.
 * @param role Foydalanuvchi roli.
 * @returns Kirish ruxsat etilgan bo'lsa `true`, aks holda `false`.
 */
export function isRouteAllowed(pathname: string, role: Role): boolean {
  const policy = findMostSpecificPolicy(pathname);
  if (!policy) return false;
  return policy.allowedRoles.includes(role);
}
