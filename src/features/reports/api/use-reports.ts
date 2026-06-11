// Hisobotlar API hooklari.
//
// Bu modul Reports_Module (Req 17) uchun React Query hooklarini ta'minlaydi.
// Hisobotlarni yuklaydigan, filtrlaydigan va eksport qiladigan funksiyalar.

import {
  keepPreviousData,
  useMutation,
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query'

import { apiClient } from '@/shared/api/client'
import { endpoints } from '@/shared/api/endpoints'
import type {
  ReportType,
  ReportData,
  ReportFilters,
  ExportFormat,
  ExportStatus,
  Faculty,
  CourseOption,
} from '../types'

/** React Query kesh kaliti — hisobotlar ro'yxati */
export function reportsQueryKey() {
  return ['reports'] as const
}

/** React Query kesh kaliti — aniq hisobot */
export function reportQueryKey(type: ReportType, filters: ReportFilters) {
  return ['reports', type, filters] as const
}

/** React Query kesh kaliti — eksport holati */
export function exportStatusQueryKey(exportId: string) {
  return ['reports', 'export', exportId] as const
}

/** React Query kesh kaliti — fakultetlar ro'yxati */
export function facultiesQueryKey() {
  return ['faculties'] as const
}

/** React Query kesh kaliti — kurslar ro'yxati */
export function coursesOptionsQueryKey(facultyId?: string) {
  return ['courses-options', facultyId] as const
}

async function fetchReportTypes(): Promise<ReportType[]> {
  const res = await apiClient.get<ReportType[]>(endpoints.reports.list)
  return res.data
}

async function generateReport(
  type: ReportType,
  filters: ReportFilters,
): Promise<ReportData> {
  const res = await apiClient.post<ReportData>(
    endpoints.reports.generate(type),
    { filters },
  )
  return res.data
}

async function exportReport(
  type: ReportType,
  format: ExportFormat,
  filters: ReportFilters,
): Promise<ExportStatus> {
  const res = await apiClient.post<ExportStatus>(
    endpoints.reports.export(type),
    { format, filters },
  )
  return res.data
}

async function fetchExportStatus(exportId: string): Promise<ExportStatus> {
  const res = await apiClient.get<ExportStatus>(`/exports/${exportId}`)
  return res.data
}

async function fetchFaculties(): Promise<Faculty[]> {
  const res = await apiClient.get<Faculty[]>('/faculties')
  return res.data
}

async function fetchCoursesOptions(facultyId?: string): Promise<CourseOption[]> {
  const params = facultyId ? { facultyId } : {}
  const res = await apiClient.get<CourseOption[]>('/courses/options', {
    params,
  })
  return res.data
}

/**
 * Hisobot turlarini yuklaydi (Req 17.1).
 */
export function useReportTypes(): UseQueryResult<ReportType[]> {
  return useQuery({
    queryKey: reportsQueryKey(),
    queryFn: fetchReportTypes,
    staleTime: 5 * 60 * 1000, // 5 daqiqa
  })
}

/**
 * Aniq hisobotni yaratadi va ma'lumotlarini yuklaydi (Req 17.1, 17.3).
 * Filtrlar o'zgarganda 1 soniyalik debounce bilan qayta yuklanadi.
 */
export function useReport(
  type: ReportType,
  filters: ReportFilters,
): UseQueryResult<ReportData> {
  return useQuery({
    queryKey: reportQueryKey(type, filters),
    queryFn: () => generateReport(type, filters),
    placeholderData: keepPreviousData,
    enabled: !!type, // Faqat hisobot turi tanlanganda ishlaydi
  })
}

/**
 * Hisobotni eksport qilish mutatsiyasi (Req 17.4, 17.5).
 */
export function useExportReport() {
  return useMutation({
    mutationFn: ({
      type,
      format,
      filters,
    }: {
      type: ReportType
      format: ExportFormat
      filters: ReportFilters
    }) => exportReport(type, format, filters),
  })
}

/**
 * Eksport holatini kuzatadi.
 */
export function useExportStatus(
  exportId: string | undefined,
): UseQueryResult<ExportStatus | undefined> {
  return useQuery({
    queryKey: exportStatusQueryKey(exportId!),
    queryFn: () => fetchExportStatus(exportId!),
    enabled: !!exportId,
    refetchInterval: (query) => {
      // Eksport davom etsa har 2 soniyada yangilanadi
      return query.state.data?.status === 'processing' || query.state.data?.status === 'pending'
        ? 2000
        : false
    },
  })
}

/**
 * Fakultetlar ro'yxatini filter uchun yuklaydi (Req 17.2).
 */
export function useFaculties(): UseQueryResult<Faculty[]> {
  return useQuery({
    queryKey: facultiesQueryKey(),
    queryFn: fetchFaculties,
    staleTime: 10 * 60 * 1000, // 10 daqiqa
  })
}

/**
 * Kurslar ro'yxatini filter uchun yuklaydi (Req 17.2).
 */
export function useCoursesOptions(
  facultyId?: string,
): UseQueryResult<CourseOption[]> {
  return useQuery({
    queryKey: coursesOptionsQueryKey(facultyId),
    queryFn: () => fetchCoursesOptions(facultyId),
    enabled: !!facultyId, // Faqat fakultet tanlanganda
    staleTime: 5 * 60 * 1000, // 5 daqiqa
  })
}