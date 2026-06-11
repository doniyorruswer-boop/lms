// LoginPage formasi uchun unit testlar (Req 1.1, 1.3).
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/shared/i18n/config";

import { LoginPage, type LoginPageProps } from "./LoginPage";

function renderLogin(props: Partial<LoginPageProps> = {}) {
  return render(
    <I18nextProvider i18n={i18n}>
      <LoginPage {...props} />
    </I18nextProvider>,
  );
}

describe("LoginPage", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("uz");
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("login/parol forma, OneID tugma va til tanlashni ko'rsatadi (Req 1.1)", () => {
    renderLogin();

    expect(screen.getByLabelText(/foydalanuvchi nomi/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Parol")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /oneid orqali kirish/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/tilni tanlash/i)).toBeInTheDocument();
  });

  it("bo'sh maydonlarda validatsiya xatolarini ko'rsatadi va onSubmit chaqirilmaydi", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderLogin({ onSubmit });

    await user.click(screen.getByRole("button", { name: /^kirish$/i }));

    expect(
      await screen.findByText(/foydalanuvchi nomini kiriting/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/parolni kiriting/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("noto'g'ri kirishda xato ko'rsatadi va parol maydonini tozalaydi (Req 1.3)", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error("invalid"));
    renderLogin({ onSubmit });

    await user.type(screen.getByLabelText(/foydalanuvchi nomi/i), "alice");
    const passwordInput = screen.getByLabelText("Parol") as HTMLInputElement;
    await user.type(passwordInput, "wrong-pass");

    await user.click(screen.getByRole("button", { name: /^kirish$/i }));

    expect(
      await screen.findByText(/foydalanuvchi nomi yoki parol noto'g'ri/i),
    ).toBeInTheDocument();
    expect(onSubmit).toHaveBeenCalledWith({
      username: "alice",
      password: "wrong-pass",
    });
    await waitFor(() => expect(passwordInput.value).toBe(""));
  });

  it("OneID tugmasi bosilganda onOneIDLogin chaqiriladi", async () => {
    const user = userEvent.setup();
    const onOneIDLogin = vi.fn();
    renderLogin({ onOneIDLogin });

    await user.click(
      screen.getByRole("button", { name: /oneid orqali kirish/i }),
    );

    expect(onOneIDLogin).toHaveBeenCalledTimes(1);
  });
});
