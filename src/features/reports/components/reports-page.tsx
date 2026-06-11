// Asosiy hisobotlar sahifasi komponenti.
//
// Bu komponent Reports_Module (Req 17) ning asosiy UI sini taqdim etadi.
// Hisobot turlarini tanlash, filtrlarni sozlash va eksport qilish
// funksiyalari mavjud.

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { Skeleton } from '@/shared/ui/skeleton'
import { AlertCircle } from 'lucide-react'

import { ReportTypeSelector } from './report-type-selector'
import { ReportFilters } from './report-filters'
import { ReportTable } from './report-table'
import { ExportButtons } from './export-buttons'
import { useReportTypes } from '../api/use-reports'
import { useDebouncedFilters } from '../lib/use-debounced-filters'
import type { ReportType } from '../types'

/**
 * Asosiy hisobotlar sahifasi (Req 17.1, 17.2, 17.4).
 * 
 * Hisobot turlarini tanlash, filtrlarni sozlash va eksport qilish
 * imkoniyatlarini taqdim etadi.
 */
export function ReportsPage() {
  const { t } = useTranslation()
  const [selectedType, setSelectedType] = useState<ReportType | undefined>()

  const {
    data: reportTypes,
    isLoading: isLoadingTypes,
    error: typesError,
  } = useReportTypes()

  const { filters, debouncedFilters, updateFilters, clearFilters } =
    useDebouncedFilters()

  if (isLoadingTypes) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (typesError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('reports.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('reports.description')}
          </p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('reports.errorTitle')}: {t('reports.errorDescription')}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('reports.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('reports.description')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('reports.selector.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportTypeSelector
            reportTypes={reportTypes || []}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
          />
        </CardContent>
      </Card>

      {selectedType && (
        <Tabs defaultValue="data" className="space-y-6">
          <TabsList>
            <TabsTrigger value="data">{t('reports.tabs.data')}</TabsTrigger>
            <TabsTrigger value="export">{t('reports.tabs.export')}</TabsTrigger>
          </TabsList>

          <TabsContent value="data" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('reports.filters.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ReportFilters
                  filters={filters}
                  onFiltersChange={updateFilters}
                  onClearFilters={clearFilters}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {t(`reports.types.${selectedType}.title`)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ReportTable
                  reportType={selectedType}
                  filters={debouncedFilters}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('reports.export.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ExportButtons
                  reportType={selectedType}
                  filters={debouncedFilters}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}