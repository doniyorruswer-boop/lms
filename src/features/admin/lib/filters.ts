// Foydalanuvchi va kurs ro'yxatlari uchun toza (pure) filtr logikasi.
//
// Komponentlar joriy sahifadagi yozuvlarni mijoz tomonida filtrlash uchun shu
// funksiyalardan foydalanadi (Req 11.1, 11.2) — `searchCourses` (Req 3.6) bilan
// bir xil yondashuv. Funksiyalar side-effect siz: kirish massivini
// o'zgartirmaydi va doim kirishning kichik to'plamini (tartibni saqlagan holda)
// qaytaradi.

import type { Course } from '@/shared/types'

import {
  ALL_FILTER,
  type AdminUser,
  type CourseFilters,
  type UserFilters,
} from '../types'

/**
 * Foydalanuvchilarni rol, OTM, fakultet va holat bo'yicha filtrlaydi (Req 11.1).
 *
 * Har bir filtr maydoni `ALL_FILTER` bo'lsa, o'sha o'lcham bo'yicha cheklov
 * qo'llanilmaydi. Barcha faol filtrlar mantiqiy VA (AND) bilan birlashtiriladi:
 * foydalanuvchi natijada bo'lishi uchun har bir faol filtrga mos kelishi kerak.
 */
export function filterUsers(
  users: AdminUser[],
  filters: UserFilters,
): AdminUser[] {
  return users.filter((user) => {
    if (filters.role !== ALL_FILTER && user.role !== filters.role) {
      return false
    }
    if (filters.otmId !== ALL_FILTER && user.otmId !== filters.otmId) {
      return false
    }
    if (
      filters.facultyId !== ALL_FILTER &&
      user.facultyId !== filters.facultyId
    ) {
      return false
    }
    if (filters.status !== ALL_FILTER && user.status !== filters.status) {
      return false
    }
    return true
  })
}

/**
 * Kurslarni ta'lim yo'nalishi, semestr va o'qituvchi bo'yicha filtrlaydi
 * (Req 11.2).
 *
 * `ALL_FILTER` qiymatli maydonlar e'tiborga olinmaydi. Semestr aniq (qat'iy)
 * tenglik bilan, o'qituvchi esa aniq nom mosligi bilan solishtiriladi.
 */
export function filterCourses(
  courses: Course[],
  filters: CourseFilters,
): Course[] {
  return courses.filter((course) => {
    if (
      filters.direction !== ALL_FILTER &&
      course.direction !== filters.direction
    ) {
      return false
    }
    if (filters.semester !== ALL_FILTER && course.semester.toString() !== filters.semester) {
      return false
    }
    if (
      filters.teacherId !== ALL_FILTER &&
      course.teacherId !== filters.teacherId
    ) {
      return false
    }
    return true
  })
}

/**
 * Berilgan massivdan takrorlanmaydigan (unique), bo'sh bo'lmagan qiymatlarni
 * tartibni saqlagan holda ajratib oladi — filtr tanlovlari (dropdown options)
 * ro'yxatini tuzish uchun yordamchi.
 */
export function distinct<T>(values: readonly T[]): NonNullable<T>[] {
  const seen = new Set<T>()
  const result: NonNullable<T>[] = []
  for (const value of values) {
    if (value === null || value === undefined || (value as unknown) === '') {
      continue
    }
    if (!seen.has(value)) {
      seen.add(value)
      result.push(value as NonNullable<T>)
    }
  }
  return result
}
