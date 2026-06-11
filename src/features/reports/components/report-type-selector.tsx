// Hisobot turini tanlash komponenti.
//
// Bu komponent foydalanuvchiga hisobot turini tanlash imkonini beradi (Req 17.1).
// Davomat, baholash, progress va sertifikatlar hisobotlari mavjud.

import { useTranslation } from 'react-i18next'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Label } from '@/shared/ui/label'
import { Card, CardContent } from '@/shared/ui/card'
import {
  ClipboardCheck,
  GraduationCap,
  TrendingUp,
  Award,
} from 'lucide-react'

import type { ReportType } from '../types'

interface ReportTypeSelectorProps {
  /** Mavjud hisobot turlari */
  reportTypes: ReportType[]
  /** Tanlangan hisobot turi */
  selectedType?: ReportType
  /** Hisobot turi o'zgarganda chaqiriladi */
  onTypeChange: (type: ReportType | undefined) => void
}

const REPORT_TYPE_ICONS: Record<ReportType, React.ComponentType<any>> = {
  attendance: ClipboardCheck,
  grades: GraduationCap,
  progress: TrendingUp,
  certificates: Award,
}

/**
 * Hisobot turini tanlash komponenti (Req 17.1).
 * 
 * Davomat, baholash natijalari, kurslar bo'yicha statistika va 
 * sertifikatlar berilishi hisobotlarini tanlash imkonini beradi.
 */
export function ReportTypeSelector({
  reportTypes,
  selectedType,
  onTypeChange,
}: ReportTypeSelectorProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="report-type">
          {t('reports.selector.label')}
        </Label>
        <Select
          value={selectedType}
          onValueChange={(value: string) =>
            onTypeChange(value as ReportType | undefined)
          }
        >
          <SelectTrigger id="report-type">
            <SelectValue placeholder={t('reports.selector.placeholder')} />
          </SelectTrigger>
          <SelectContent>
            {reportTypes.map((type) => {
              const Icon = REPORT_TYPE_ICONS[type]
              return (
                <SelectItem key={type} value={type}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {t(`reports.types.${type}.name`)}
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      {selectedType && (
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              {(() => {
                const Icon = REPORT_TYPE_ICONS[selectedType]
                return <Icon className="h-5 w-5 mt-0.5 text-primary" />
              })()}
              <div>
                <h3 className="font-medium text-sm">
                  {t(`reports.types.${selectedType}.name`)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t(`reports.types.${selectedType}.description`)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}