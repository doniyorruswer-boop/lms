// Hisobotlar uchun debounced filtrlar hooki.
//
// Bu hook 1 soniyalik debounce bilan filtrlarni boshqaradi (Req 17.3).
// Foydalanuvchi filtrlarni o'zgarganda darhol hisobot qayta yuklanmaydi,
// balki 1 soniya kutib so'ng yangilanadi.

import { useState, useMemo, useEffect } from 'react'
import { debounce } from '@/shared/lib/debounce'
import type { ReportFilters } from '../types'

interface UseDebouncedFiltersProps {
  /** Boshlang'ich filtrlar */
  initialFilters?: ReportFilters
  /** Debounce kechikishi (millisekund) */
  delay?: number
}

interface UseDebouncedFiltersReturn {
  /** Joriy filtrlar (darhol yangilanadi UI uchun) */
  filters: ReportFilters
  /** Debounced filtrlar (API so'rovlari uchun) */
  debouncedFilters: ReportFilters
  /** Filtrlarni yangilash funksiyasi */
  updateFilters: (newFilters: Partial<ReportFilters>) => void
  /** Filtrlarni tozalash */
  clearFilters: () => void
}

/**
 * Hisobot filtrlarini 1 soniyalik debounce bilan boshqaradi (Req 17.3).
 * 
 * @param props - Hook parametrlari
 * @returns Filter holati va boshqarish funksiyalari
 */
export function useDebouncedFilters({
  initialFilters = {},
  delay = 1000, // 1 soniya (Req 17.3)
}: UseDebouncedFiltersProps = {}): UseDebouncedFiltersReturn {
  const [filters, setFilters] = useState<ReportFilters>(initialFilters)
  const [debouncedFilters, setDebouncedFilters] =
    useState<ReportFilters>(initialFilters)

  // Debounced yangilash funksiyasi
  const debouncedUpdate = useMemo(
    () =>
      debounce((newFilters: ReportFilters) => {
        setDebouncedFilters(newFilters)
      }, delay),
    [delay],
  )

  // Komponent unmount bo'lganda kutilayotgan debounce chaqiruvini bekor qilish
  // (unmount bo'lgandan keyin state yangilanmasligi uchun).
  useEffect(() => {
    return () => {
      debouncedUpdate.cancel()
    }
  }, [debouncedUpdate])

  const updateFilters = (newFilters: Partial<ReportFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    debouncedUpdate(updatedFilters)
  }

  const clearFilters = () => {
    // Tozalash darhol amalga oshadi — kutilayotgan debounce chaqiruvini bekor
    // qilib, ham UI ham so'rov filtrlarini bo'shatamiz.
    debouncedUpdate.cancel()
    const emptyFilters = {}
    setFilters(emptyFilters)
    setDebouncedFilters(emptyFilters)
  }

  return {
    filters,
    debouncedFilters,
    updateFilters,
    clearFilters,
  }
}