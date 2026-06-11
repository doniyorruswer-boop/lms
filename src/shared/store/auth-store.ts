import { create } from "zustand";

import { tokenStorage } from "@/shared/auth/token-storage";
import type { JwtTokens, UserProfile } from "@/shared/types";

/**
 * Autentifikatsiya holati store-i (Req 1.2, 21.6).
 *
 * Foydalanuvchi profili, JWT tokenlar va login/logout holat o'zgarishlarini
 * boshqaradi. Tokenlar `tokenStorage` orqali `localStorage` ga saqlanadi:
 * `setSession` tokenlarni saqlaydi, `clearSession` esa ularni o'chiradi.
 */
export interface AuthState {
  /** Joriy foydalanuvchi profili, login qilmagan bo'lsa `null`. */
  user: UserProfile | null;
  /** Joriy JWT tokenlar, login qilmagan bo'lsa `null`. */
  tokens: JwtTokens | null;
  /** Foydalanuvchi autentifikatsiyadan o'tganmi. */
  isAuthenticated: boolean;

  /**
   * Login muvaffaqiyatli bo'lganda sessiyani o'rnatadi: foydalanuvchi va
   * tokenlarni store-da saqlaydi hamda tokenlarni `tokenStorage` ga yozadi.
   */
  setSession: (user: UserProfile, tokens: JwtTokens) => void;
  /**
   * Logout: store holatini tozalaydi va `tokenStorage` dagi tokenlarni
   * o'chiradi.
   */
  clearSession: () => void;
  /** Faqat foydalanuvchi profilini yangilaydi (masalan, profil tahrirlangach). */
  setUser: (user: UserProfile) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tokens: null,
  isAuthenticated: false,

  setSession: (user, tokens) => {
    tokenStorage.setTokens(tokens);
    set({ user, tokens, isAuthenticated: true });
  },

  clearSession: () => {
    tokenStorage.clear();
    set({ user: null, tokens: null, isAuthenticated: false });
  },

  setUser: (user) => {
    set({ user });
  },
}));
