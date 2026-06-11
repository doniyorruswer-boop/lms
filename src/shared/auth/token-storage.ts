import type { JwtTokens } from "@/shared/types";

/**
 * Token saqlash qatlami (Req 1.2, 1.7).
 *
 * JWT access/refresh tokenlarni xavfsiz tarzda `localStorage` da saqlaydi,
 * o'qiydi va o'chiradi. `localStorage` ga murojaatlar `try/catch` bilan
 * o'raladi — SSR, privat rejim yoki saqlash kvotasi xatolarida ilova
 * ishdan chiqmaydi.
 */

const ACCESS_TOKEN_KEY = "lms.auth.accessToken";
const REFRESH_TOKEN_KEY = "lms.auth.refreshToken";
const EXPIRES_AT_KEY = "lms.auth.expiresAt";

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage mavjud emas yoki kvota tugagan — jimgina o'tkazib yuboriladi.
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // O'chirib bo'lmasa ham ilova ishlashda davom etadi.
  }
}

export interface TokenStorage {
  /** Saqlangan access token, mavjud bo'lmasa `null`. */
  getAccessToken(): string | null;
  /** Saqlangan refresh token, mavjud bo'lmasa `null`. */
  getRefreshToken(): string | null;
  /** Access/refresh tokenlar va amal qilish muddatini saqlaydi. */
  setTokens(tokens: JwtTokens): void;
  /** Barcha saqlangan tokenlarni o'chiradi. */
  clear(): void;
}

export const tokenStorage: TokenStorage = {
  getAccessToken(): string | null {
    return safeGet(ACCESS_TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    return safeGet(REFRESH_TOKEN_KEY);
  },

  setTokens(tokens: JwtTokens): void {
    safeSet(ACCESS_TOKEN_KEY, tokens.accessToken);
    safeSet(REFRESH_TOKEN_KEY, tokens.refreshToken);
    safeSet(EXPIRES_AT_KEY, String(tokens.expiresAt));
  },

  clear(): void {
    safeRemove(ACCESS_TOKEN_KEY);
    safeRemove(REFRESH_TOKEN_KEY);
    safeRemove(EXPIRES_AT_KEY);
  },
};
