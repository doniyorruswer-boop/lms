/**
 * Login-redirect helperlari (toza logika).
 *
 * JWT_Token mavjud bo'lmagan foydalanuvchi himoyalangan URL ga kirsa,
 * Routing_Module uni `/login` ga yo'naltiradi va boshlang'ich URL ni
 * `redirect` parametrida saqlaydi (Req 2.7). Login muvaffaqiyatli bo'lgach,
 * foydalanuvchi shu boshlang'ich URL ga qaytariladi.
 *
 * `buildLoginUrl` va `parseRedirectParam` round-trip kafolatlaydi:
 *   parseRedirectParam(buildLoginUrl(path)) === path
 * hatto `path` ichida `?`, `#`, `&` kabi maxsus belgilar bo'lsa ham
 * (URL-encode/decode orqali) — Design Property 3.
 */

/** Login sahifasi yo'li. */
export const LOGIN_PATH = "/login";

/** Boshlang'ich URL saqlanadigan query parametr nomi. */
export const REDIRECT_PARAM = "redirect";

/**
 * Berilgan `originalPath` ni `redirect` query parametrida saqlovchi login
 * URL ni quradi. `originalPath` xavfsiz tarzda URL-encode qilinadi, shuning
 * uchun undagi `?`, `#`, `&` belgilar query strukturasini buzmaydi.
 */
export function buildLoginUrl(originalPath: string): string {
  const encoded = encodeURIComponent(originalPath);
  return `${LOGIN_PATH}?${REDIRECT_PARAM}=${encoded}`;
}

/**
 * Login URL dan `redirect` parametrini ajratib oladi va dekod qiladi.
 * Parametr mavjud bo'lmasa `null` qaytaradi.
 *
 * Faqat birinchi `?` dan keyingi query qismdan `redirect` qiymati o'qiladi.
 * Qiymat `[^&]*` bilan ushlanadi, shuning uchun keyingi parametrlar (`&...`)
 * va dekod qilingan maxsus belgilar to'g'ri saqlanadi.
 */
export function parseRedirectParam(loginUrl: string): string | null {
  const queryIndex = loginUrl.indexOf("?");
  if (queryIndex === -1) return null;

  const query = loginUrl.slice(queryIndex + 1);
  const match = query.match(
    new RegExp(`(?:^|&)${REDIRECT_PARAM}=([^&]*)`),
  );
  if (!match) return null;

  return decodeURIComponent(match[1] ?? "");
}
