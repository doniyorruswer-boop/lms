// DEV-ONLY: Login sahifasida ko'rsatiladigan tezkor rol tanlash paneli.
//
// Faqat `import.meta.env.DEV` rejimida render qilinadi (LoginRoute shart
// qo'yadi). Har bir tugma tegishli rol bilan soxta sessiya o'rnatib, o'sha
// rolning paneliga yo'naltiradi — backendsiz UI ni sinash uchun.

import { Button } from "@/shared/ui/button";
import type { Role } from "@/shared/types";

import { useDevMockLogin } from "./dev-mock-login";

/** Panelda ko'rsatiladigan rollar va ularning yorliqlari. */
const DEV_ROLES: { role: Role; label: string }[] = [
  { role: "STUDENT", label: "Student" },
  { role: "TEACHER", label: "Teacher" },
  { role: "OTM_ADMIN", label: "OTM Admin" },
  { role: "DEKAN", label: "Dekan" },
  { role: "SUPER_ADMIN", label: "Super Admin" },
];

/**
 * Dev rejimida login sahifasi ostida ko'rsatiladigan tezkor kirish paneli.
 */
export function DevLoginPanel() {
  const devLogin = useDevMockLogin();

  return (
    <div className="mt-6 rounded-md border border-dashed border-amber-400 bg-amber-50 p-4 dark:border-amber-500/50 dark:bg-amber-500/10">
      <p className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
        Dev rejimi · tezkor kirish
      </p>
      <div className="grid grid-cols-2 gap-2">
        {DEV_ROLES.map(({ role, label }) => (
          <Button
            key={role}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => devLogin(role)}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
