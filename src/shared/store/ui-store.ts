// Global UI holati: til (locale), mavzu (theme) va sidebar holati.
// Zustand 4 yordamida saqlanadi. Requirements: 21.6.
import { create } from "zustand";
import { DEFAULT_LOCALE, type Locale } from "../types";

// Qo'llab-quvvatlanadigan mavzular.
export type Theme = "light" | "dark";

export const DEFAULT_THEME: Theme = "light";

export interface UiState {
  // Tanlangan interfeys tili.
  locale: Locale;
  // Tanlangan rang mavzusi.
  theme: Theme;
  // Sidebar ochiqligini bildiruvchi flag.
  sidebarOpen: boolean;

  // Tilni o'zgartirish.
  setLocale: (locale: Locale) => void;
  // Mavzuni aniq qiymatga o'rnatish.
  setTheme: (theme: Theme) => void;
  // Light/dark mavzu o'rtasida almashtirish.
  toggleTheme: () => void;
  // Sidebar ochiqligini aniq qiymatga o'rnatish.
  setSidebarOpen: (open: boolean) => void;
  // Sidebar ochiq/yopiq holatini almashtirish.
  toggleSidebar: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  locale: DEFAULT_LOCALE,
  theme: DEFAULT_THEME,
  sidebarOpen: true,

  setLocale: (locale) => set({ locale }),
  setTheme: (theme) => set({ theme }),
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
