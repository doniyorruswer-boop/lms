// Reports_Module barrel eksport fayli.
//
// Bu modul hisobotlar feature sining barcha komponent va hooklarini
// bitta kirish nuqtasidan eksport qiladi.

// Asosiy sahifa komponenti
export { ReportsPage } from './components/reports-page'

// Komponentlar
export { ReportTypeSelector } from './components/report-type-selector'
export { ReportFilters } from './components/report-filters'
export { ReportTable } from './components/report-table'
export { ExportButtons } from './components/export-buttons'

// API hooklari
export {
  useReportTypes,
  useReport,
  useExportReport,
  useExportStatus,
  useFaculties,
  useCoursesOptions,
} from './api/use-reports'

// Utility hooklari
export { useDebouncedFilters } from './lib/use-debounced-filters'

// Tiplar
export type {
  ReportType,
  ExportFormat,
  ReportFilters as ReportFiltersType,
  ReportData,
  ExportStatus,
  AttendanceReportRow,
  GradesReportRow,
  ProgressReportRow,
  CertificatesReportRow,
  Faculty,
  CourseOption,
} from './types'