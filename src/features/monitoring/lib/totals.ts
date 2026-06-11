// Toza, side-effect siz monitoring agregatsiya logikasi (Req 13.1).
//
// Monitoring panelidagi indikator kartochkalari barcha OTM bo'yicha umumiy
// talaba, o'qituvchi va kurs sonlarini ko'rsatadi. Bu summalarni `OtmStats`
// ro'yxatidan hisoblash toza funksiya sifatida ajratilgan — shunda u alohida
// sinaladi va UI faqat natijani ko'rsatadi.

import type { OtmStats } from '@/shared/types'

/** Indikator kartochkalari uchun umumiy ko'rsatkichlar. */
export interface IndicatorTotals {
  /** Barcha OTM bo'yicha umumiy talabalar soni. */
  totalStudents: number
  /** Barcha OTM bo'yicha umumiy o'qituvchilar soni. */
  totalTeachers: number
  /** Barcha OTM bo'yicha umumiy kurslar soni. */
  totalCourses: number
  /** OTMlar soni. */
  otmCount: number
}

/**
 * `OtmStats` ro'yxatidan indikator kartochkalari uchun umumiy ko'rsatkichlarni
 * hisoblaydi. Bo'sh ro'yxat uchun barcha qiymatlar `0` bo'ladi (Req 13.1).
 */
export function computeIndicatorTotals(stats: readonly OtmStats[]): IndicatorTotals {
  return stats.reduce<IndicatorTotals>(
    (acc, stat) => ({
      totalStudents: acc.totalStudents + stat.studentCount,
      totalTeachers: acc.totalTeachers + stat.teacherCount,
      totalCourses: acc.totalCourses + stat.courseCount,
      otmCount: acc.otmCount + 1,
    }),
    { totalStudents: 0, totalTeachers: 0, totalCourses: 0, otmCount: 0 }
  )
}
