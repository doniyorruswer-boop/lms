// Mavzu (theme) provideri — `ui-store` dagi tanlangan mavzuni hujjat
// ildiziga (`<html>`) qo'llaydi. Tailwind `dark` varianti `.dark` klassiga
// tayanadi, shuning uchun mavzu o'zgarganda klass yangilanadi.
import { useEffect, type ReactNode } from "react";

import { useUiStore } from "@/shared/store/ui-store";

export interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * `ui-store` dagi `theme` qiymatini kuzatadi va `document.documentElement`
 * ga `dark`/`light` klassini qo'llaydi. Mavzu store orqali o'zgarganda
 * DOM avtomatik yangilanadi (sahifa qayta yuklanmasdan).
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useUiStore((state) => state.theme);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  return <>{children}</>;
}

export default ThemeProvider;
