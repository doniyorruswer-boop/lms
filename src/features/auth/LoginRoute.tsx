// Login sahifasi konteyneri (Req 1.1, 1.2, 1.4).
//
// Prezentatsion `LoginPage` ni login mutatsiyasiga (`useLogin`) va OneID
// tugmasiga (`OneIDButton`) ulaydi. Marshrut shu konteynerni render qiladi.
//
//   - Forma yuborilganda `login()` mutatsiyasi ishga tushadi; xato bo'lsa
//     (mas. 401) Promise rad etiladi va `LoginPage` xato xabarini ko'rsatib
//     parol maydonini tozalaydi (Req 1.3). Muvaffaqiyatda mutatsiya sessiyani
//     o'rnatadi va rolga yo'naltiradi (Req 1.2).
//   - OneID tugmasi bosilganda OAuth avtorizatsiya URL ga yo'naltiriladi
//     (Req 1.4).

import { DevLoginPanel } from "./dev/DevLoginPanel";
import { LoginPage } from "./LoginPage";
import { OneIDButton } from "./OneIDButton";
import { useLogin } from "./api/use-login";
import type { LoginFormValues } from "./login-schema";

/**
 * Login sahifasini autentifikatsiya oqimiga ulaydigan konteyner komponenti.
 */
export function LoginRoute() {
  const login = useLogin();

  async function handleSubmit(credentials: LoginFormValues): Promise<void> {
    // `mutateAsync` xato bo'lsa rad etadi — `LoginPage` uni ushlaydi.
    await login.mutateAsync(credentials);
  }

  return (
    <LoginPage onSubmit={handleSubmit} oneIdButton={<OneIDButton />}>
      {/* DEV-ONLY: backendsiz tezkor rol tanlash paneli (production da render qilinmaydi). */}
      {import.meta.env.DEV ? <DevLoginPanel /> : null}
    </LoginPage>
  );
}
