// Ilova darajasidagi providerlar (Req 21.5).
//
// Bu modul barcha global kontekstlarni bitta `Providers` komponentida
// birlashtiradi va `main.tsx` da ilova ildizini o'raydi:
//   - QueryClientProvider — React Query 5 server-state keshini ta'minlaydi
//   - I18nextProvider     — `shared/i18n/config.ts` dagi i18next instansi
//   - ThemeProvider       — `ui-store` dagi mavzuni DOM ga qo'llaydi
//
// Eslatma: autentifikatsiya holati Zustand global store-i (`auth-store.ts`)
// orqali boshqariladi va React Context provideri talab qilmaydi — shu sabab
// auth holati providerlar daraxtining istalgan qismidan to'g'ridan-to'g'ri
// `useAuthStore` orqali o'qiladi.
import { type ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";

import i18n from "@/shared/i18n/config";
import { Toaster } from "@/shared/ui/toaster";

import { ThemeProvider } from "./theme-provider";

/**
 * Ilova bo'ylab yagona `QueryClient` instansi.
 *
 * - `retry: false` — 5xx qayta urinishlari API qatlamidagi axios interceptor
 *   (`shared/api/retry.ts`) tomonidan eksponensial backoff bilan amalga
 *   oshiriladi; React Query darajasida takroriy retry o'chiriladi.
 * - `staleTime` — keshlangan ma'lumotlar 1 daqiqa "fresh" hisoblanadi.
 * - `refetchOnWindowFocus: false` — oynaga qaytishda avtomatik qayta yuklash
 *   o'chiriladi.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

export interface ProvidersProps {
  children: ReactNode;
}

/**
 * Barcha global providerlarni birlashtiradi. Ilova ildizi (`main.tsx`)
 * shu komponent bilan o'raladi (Req 21.5).
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider>
          {children}
          {/* Toast bildirishnomalari uchun global viewport (Req 16.2). */}
          <Toaster />
        </ThemeProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

export default Providers;
