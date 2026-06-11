// Rollar
export type Role = "SUPER_ADMIN" | "OTM_ADMIN" | "DEKAN" | "TEACHER" | "STUDENT";

// Autentifikatsiya
export interface JwtTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch ms
}

export interface UserProfile {
  id: string;
  fullName: string;
  role: Role;
  otmId: string | null;
  facultyId: string | null;
  email: string | null;
  avatarUrl: string | null;
}
