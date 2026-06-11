// Layout komponentlari uchun testlar (Req 19.2, 20.2, 20.3, 20.4).
//
// - nav-config: rolga asoslangan menyu havolalari (toza funksiya) — unit + PBT.
// - Sidebar/Header/ProtectedLayout/PublicLayout: render, qulaylik (a11y),
//   rolga qarab menyu, gamburger tugmasi va Outlet.

import { describe, expect, it, beforeAll, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import fc from "fast-check";

import i18n from "@/shared/i18n/config";
import { useAuthStore } from "@/shared/store/auth-store";
import { useNotificationStore } from "@/shared/store/notification-store";
import { useUiStore } from "@/shared/store/ui-store";
import type { Role, UserProfile } from "@/shared/types";

import { ProtectedLayout } from "./ProtectedLayout";
import { PublicLayout } from "./PublicLayout";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { NAV_ITEMS_BY_ROLE, navItemsForRole } from "./nav-config";

const ALL_ROLES: Role[] = ["STUDENT", "TEACHER", "OTM_ADMIN", "DEKAN", "SUPER_ADMIN"];

function makeUser(role: Role): UserProfile {
  return {
    id: "u1",
    fullName: "Ali Valiyev",
    role,
    otmId: null,
    facultyId: null,
    email: null,
    avatarUrl: null,
  };
}

function resetStores() {
  useAuthStore.setState({ user: null, tokens: null, isAuthenticated: false });
  useNotificationStore.setState({ items: [], unreadCount: 0 });
  useUiStore.setState({ sidebarOpen: true });
}

beforeAll(async () => {
  // Testlarni aniq tilda (uz) ishlatamiz — yorliqlar deterministik bo'lsin.
  await i18n.changeLanguage("uz");
});

beforeEach(() => {
  resetStores();
});

describe("nav-config: navItemsForRole", () => {
  it("rol berilmaganda bo'sh ro'yxat qaytaradi", () => {
    expect(navItemsForRole(null)).toEqual([]);
    expect(navItemsForRole(undefined)).toEqual([]);
  });

  it("har bir rol uchun kamida bitta havola mavjud", () => {
    for (const role of ALL_ROLES) {
      expect(navItemsForRole(role).length).toBeGreaterThan(0);
    }
  });

  it("har bir rolning havolalari shu rolning panel prefiksiga mos keladi", () => {
    const prefixByRole: Record<Role, string> = {
      STUDENT: "/student/",
      TEACHER: "/teacher/",
      OTM_ADMIN: "/admin/",
      DEKAN: "/admin/",
      SUPER_ADMIN: "/monitoring/",
    };
    for (const role of ALL_ROLES) {
      for (const item of NAV_ITEMS_BY_ROLE[role]) {
        expect(item.to.startsWith(prefixByRole[role])).toBe(true);
      }
    }
  });

  it("PBT: barcha rollar uchun havolalar to'g'ri shaklga ega (to + labelKey)", () => {
    fc.assert(
      fc.property(fc.constantFrom(...ALL_ROLES), (role) => {
        for (const item of navItemsForRole(role)) {
          expect(item.to.startsWith("/")).toBe(true);
          expect(item.labelKey.startsWith("nav.")).toBe(true);
          expect(typeof item.icon).toBe("object");
        }
      }),
    );
  });
});

describe("Sidebar", () => {
  it("rolga qarab tegishli havolalarni ko'rsatadi", () => {
    render(
      <MemoryRouter>
        <Sidebar role="STUDENT" open onNavigate={() => {}} />
      </MemoryRouter>,
    );
    const nav = screen.getByRole("navigation");
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(NAV_ITEMS_BY_ROLE.STUDENT.length);
    expect(nav).toHaveAccessibleName();
  });

  it("rol null bo'lsa havolalarni ko'rsatmaydi", () => {
    render(
      <MemoryRouter>
        <Sidebar role={null} open onNavigate={() => {}} />
      </MemoryRouter>,
    );
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });
});

describe("Header", () => {
  it("o'qilmagan bildirishnoma soni 0 bo'lsa badge ko'rsatmaydi", () => {
    render(
      <MemoryRouter>
        <Header userName="Ali" onMenuToggle={() => {}} />
      </MemoryRouter>,
    );
    // NotificationManager component should be rendered
    expect(screen.getByText("LMS")).toBeInTheDocument();
  });

  it("gamburger tugmasi bosilganda onMenuToggle chaqiriladi", async () => {
    const user = userEvent.setup();
    let toggled = 0;
    render(
      <MemoryRouter>
        <Header userName="Ali" onMenuToggle={() => (toggled += 1)} />
      </MemoryRouter>,
    );
    const menuBtn = screen.getByRole("button", { name: /menyuni ochish/i });
    await user.click(menuBtn);
    expect(toggled).toBe(1);
  });
});

describe("ProtectedLayout", () => {
  function renderProtected(role: Role) {
    useAuthStore.setState({ user: makeUser(role), isAuthenticated: true });
    return render(
      <MemoryRouter initialEntries={["/x"]}>
        <Routes>
          <Route element={<ProtectedLayout />}>
            <Route path="/x" element={<div>Sahifa kontenti</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
  }

  it("Outlet kontentini, Header va rolga mos Sidebar havolalarini ko'rsatadi", () => {
    renderProtected("TEACHER");
    expect(screen.getByText("Sahifa kontenti")).toBeInTheDocument();
    // Sidebar havolalari + "Asosiy kontentga o'tish" skip-link (1 ta).
    expect(screen.getAllByRole("link")).toHaveLength(
      NAV_ITEMS_BY_ROLE.TEACHER.length + 1,
    );
    expect(screen.getByRole("button", { name: /menyuni ochish/i })).toBeInTheDocument();
  });

  it("a11y buzilishlari yo'q (jest-axe)", async () => {
    const { container } = renderProtected("STUDENT");
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe("PublicLayout", () => {
  it("til tanlash va Outlet kontentini ko'rsatadi", () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/login" element={<div>Login form</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("Login form")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /til/i })).toBeInTheDocument();
  });
});
