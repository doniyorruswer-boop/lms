// Login formasi uchun Zod sxemasi (Req 1.1, 1.3).
//
// Foydalanuvchi nomi va parol bo'sh bo'lmasligi kerak. Xato xabarlari i18n
// kalitlari sifatida saqlanadi va UI da `t(...)` orqali tarjima qilinadi.

import { z } from "zod";

/** Login formasi maydonlari validatsiyasi. */
export const loginSchema = z.object({
  username: z.string().trim().min(1, "login.usernameRequired"),
  password: z.string().min(1, "login.passwordRequired"),
});

/** Login formasi qiymatlari turi. */
export type LoginFormValues = z.infer<typeof loginSchema>;
