// ForbiddenPage (403) komponenti uchun unit testlar (Req 2.6).
import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it } from "vitest";

import i18n from "@/shared/i18n/config";

import { ForbiddenPage } from "./forbidden-page";

function renderForbidden() {
  return render(
    <I18nextProvider i18n={i18n}>
      <ForbiddenPage />
    </I18nextProvider>,
  );
}

describe("ForbiddenPage", () => {
  it('"403 — Ruxsat yo\'q" sarlavhasini ko\'rsatadi', async () => {
    await i18n.changeLanguage("uz");
    renderForbidden();

    expect(
      screen.getByRole("heading", { name: /403 — Ruxsat yo'q/i }),
    ).toBeInTheDocument();
  });

  it("tushuntirish matni va bosh sahifa havolasini ko'rsatadi", async () => {
    await i18n.changeLanguage("uz");
    renderForbidden();

    expect(
      screen.getByText(/ushbu sahifaga kirish uchun ruxsat yo'q/i),
    ).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /bosh sahifaga qaytish/i });
    expect(link).toHaveAttribute("href", "/");
  });
});
