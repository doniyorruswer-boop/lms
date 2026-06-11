// Admin_Panel (Req 11) uchun feature-local tiplar.
//
// Foydalanuvchilar ro'yxati rol/OTM/fakultet/holat bo'yicha filtrlanadi
// (Req 11.1). Shared `UserProfile` tipi `status` va inson o'qiy oladigan
// OTM/fakultet nomlarini o'z ichiga olmaydi, shu sababli admin ro'yxati
// uchun alohida ko'rinish modeli (`AdminUser`) e'lon qilinadi.

import type { Role } from '@/shared/types'

/** Foydalanuvchining hisob holati (Req 11.1 — holat filtri). */
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'

/**
 * Admin foydalanuvchilar ro'yxatidagi bitta yozuv.
 *
 * Backend `/users` endpointi rol, OTM, fakultet va holat ma'lumotlarini
 * qaytaradi; ro'yxat jadvalida shu maydonlar ko'rsatiladi va filtrlanadi.
 */
export interface AdminUser {
  id: string
  fullName: string
  email: string | null
  role: Role
  otmId: string | null
  otmName: string | null
  facultyId: string | null
  facultyName: string | null
  status: UserStatus
}

/** Foydalanuvchilar ro'yxati uchun barcha mavjud holatlar (filtr for). */
export const USER_STATUSES: readonly UserStatus[] = [
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
] as const

/** Foydalanuvchilar ro'yxati uchun barcha mavjud rollar (filtr uchun). */
export const USER_ROLES: readonly Role[] = [
  'SUPER_ADMIN',
  'OTM_ADMIN',
  'DEKAN',
  'TEACHER',
  'STUDENT',
] as const

/** "Barchasi" filtri uchun maxsus qiymat. */
export const ALL_FILTER = '' as const
export type AllFilter = typeof ALL_FILTER

/** Foydalanuvchilar filtrining turi. */
export interface UserFilters {
  role?: Role | AllFilter
  otmId?: string
  facultyId?: string
  status?: UserStatus | AllFilter
}

/** Kurslar filtrining turi. */
export interface CourseFilters {
  direction?: string
  semester?: string
  teacherId?: string
}

/** Bo'sh foydalanuvchi filtrlari. */
export const EMPTY_USER_FILTERS: UserFilters = {
  role: ALL_FILTER,
  otmId: '',
  facultyId: '',
  status: ALL_FILTER,
}

/** Bo'sh kurs filtrlari. */
export const EMPTY_COURSE_FILTERS: CourseFilters = {
  direction: '',
  semester: '',
  teacherId: '',
}
