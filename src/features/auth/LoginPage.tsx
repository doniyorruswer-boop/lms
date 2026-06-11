// Login sahifasi (Req 1.1, 1.3).
//
// - React Hook Form + Zod (`zodResolver`) bilan login/parol formasi.
// - OneID orqali kirish tugmasi (haqiqiy OAuth oqimi 15.3-vazifada ulanadi).
// - Header-da til tanlash boshqaruvi (`LanguageSelector`).
// - Noto'g'ri kirishda (onSubmit rad etilganda) forma ostida xato xabari
//   kamida 5 soniya ko'rsatiladi va parol maydoni tozalanadi (Req 1.3).
//
// Login mutatsiyasi (JWT olish/saqlash, rolga yo'naltirish) 15.2-vazifada
// implementatsiya qilinadi. Bu yerda `onSubmit` callback prop sifatida
// qabul qilinadi va keyinchalik mutatsiyaga ulanadi.

import { zodResolver } from "@hookform/resolvers/zod";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { LanguageSelector } from "@/shared/components/layout";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";

import { loginSchema, type LoginFormValues } from "./login-schema";

/** Xato xabari ko'rsatiladigan eng kam vaqt (Req 1.3: 5 soniyadan kam emas). */
export const LOGIN_ERROR_MIN_DURATION_MS = 5000;

export interface LoginPageProps {
  /**
   * Login ma'lumotlarini yuborish callback-i. Noto'g'ri kirishda Promise rad
   * etilishi (reject/throw) kerak — shunda xato xabari ko'rsatiladi va parol
   * tozalanadi. 15.2-vazifada login mutatsiyasiga ulanadi.
   */
  onSubmit?: (credentials: LoginFormValues) => Promise<void>;
  /**
   * OneID tugmasi bosilganda chaqiriladi. Faqat `oneIdButton` berilmaganda
   * ko'rsatiladigan standart OneID tugmasi uchun ishlatiladi.
   */
  onOneIDLogin?: () => void;
  /**
   * OneID tugmasi sifatida render qilinadigan maxsus tugma (mas. haqiqiy
   * OAuth redirect ni amalga oshiruvchi `OneIDButton`). Berilsa, standart
   * tugma o'rniga shu render qilinadi.
   */
  oneIdButton?: ReactNode;
  /**
   * OneID tugmasidan keyin render qilinadigan qo'shimcha kontent (mas. dev
   * rejimidagi tezkor kirish paneli).
   */
  children?: ReactNode;
}

/**
 * Default `onSubmit` — login mutatsiyasi ulanmaguncha placeholder.
 * Hech qachon muvaffaqiyat qaytarmaydi, balki rad etadi.
 */
async function defaultOnSubmit(): Promise<void> {
  return Promise.reject(new Error("login.notWired"));
}

/**
 * Login/parol formasi, OneID tugmasi va til tanlash boshqaruvini ko'rsatuvchi
 * sahifa. Forma validatsiyasi RHF + Zod orqali, xatolar maydon ostida.
 */
export function LoginPage({
  onSubmit = defaultOnSubmit,
  onOneIDLogin,
  oneIdButton,
  children,
}: LoginPageProps) {
  const { t } = useTranslation();
  const [credentialError, setCredentialError] = useState<string | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    register,
    handleSubmit,
    resetField,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  // Komponent unmount bo'lganda xato taymerini tozalash (memory leak oldini olish).
  useEffect(() => {
    return () => {
      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current);
      }
    };
  }, []);

  function showCredentialError(message: string) {
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
    }
    setCredentialError(message);
    // Xato kamida 5 soniya ko'rsatiladi, so'ng avtomatik yo'qoladi (Req 1.3).
    errorTimerRef.current = setTimeout(() => {
      setCredentialError(null);
      errorTimerRef.current = null;
    }, LOGIN_ERROR_MIN_DURATION_MS);
  }

  const submitHandler = handleSubmit(async (values) => {
    setCredentialError(null);
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }
    try {
      await onSubmit(values);
    } catch {
      // Noto'g'ri kirish: xato xabarini ko'rsatish + parol maydonini tozalash.
      showCredentialError(t("login.error"));
      resetField("password");
      setFocus("password");
    }
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-end p-4">
        <LanguageSelector />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <Card className="w-full max-w-sm p-6">
          <h1 className="mb-6 text-center text-2xl font-semibold">
            {t("login.title")}
          </h1>

          <form noValidate onSubmit={submitHandler} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="login-username" className="text-sm font-medium">
                {t("login.username")}
              </label>
              <Input
                id="login-username"
                type="text"
                autoComplete="username"
                aria-invalid={errors.username ? "true" : undefined}
                aria-describedby={
                  errors.username ? "login-username-error" : undefined
                }
                {...register("username")}
              />
              {errors.username ? (
                <p
                  id="login-username-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {t(errors.username.message ?? "")}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="login-password" className="text-sm font-medium">
                {t("login.password")}
              </label>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                aria-invalid={errors.password ? "true" : undefined}
                aria-describedby={
                  errors.password ? "login-password-error" : undefined
                }
                {...register("password")}
              />
              {errors.password ? (
                <p
                  id="login-password-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {t(errors.password.message ?? "")}
                </p>
              ) : null}
            </div>

            {credentialError ? (
              <p role="alert" className="text-sm text-destructive">
                {credentialError}
              </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {t("login.submit")}
            </Button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase text-muted-foreground">
              {t("login.or")}
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          {oneIdButton ?? (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onOneIDLogin}
            >
              {t("login.oneid")}
            </Button>
          )}

          {children}
        </Card>
      </main>
    </div>
  );
}
