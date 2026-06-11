import type { Role } from "./auth";

// Marshrut himoyasi konfiguratsiyasi
export interface RouteGuardConfig {
  path: string;
  allowedRoles: Role[];
}
