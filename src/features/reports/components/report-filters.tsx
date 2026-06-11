// Hisobot filtrlari komponenti.
//
// Bu komponent hisobot uchun filtrlarni sozlash imkonini beradi (Req 17.2).
// Sana oralig'i, fakultet, ta'lim yo'nalishi va kurs bo'yicha filtrlash mumkin.

import { useTranslation } from 'react-i18next'
import { CalendarIcon, X } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/shared/lib/utils'

import { Button } from '@/shared/ui/button'
import { Label } from '@/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/popover'
import { Calendar } from '@/shared/ui/calendar'

import { useFaculties, useCoursesOptions } from '../api/use-reports'
import type { ReportFilters as ReportFiltersType } from '../types'

interface ReportFiltersProps {
  /** Joriy filtrlar */
  filters: ReportFiltersType
  /** Filtrlar o'zgarganda chaqiriladi (Req 17.3 - 1s debounce) */
  onFiltersChange: (filters: Partial<ReportFiltersType>) => void
  /** Filtrlarni tozalash */
  onClearFilters: () => void
}

/**
 * Hisobot filtrlari komponenti (Req 17.2).
 * 
 * Sana oralig'i, fakultet, ta'lim yo'nalishi va kurs bo'yicha 
 * filtrlash boshqaruvlarini ta'minlaydi.
 */
export function ReportFilters({
  filters,
  onFiltersChange,
  onClearFilters,
}: ReportFiltersProps) {
  const { t } = useTranslation()

  const { data: faculties, isLoading: isLoadingFaculties } = useFaculties()
  const { data: courses, isLoading: isLoadingCourses } = useCoursesOptions(
    filters.facultyId,
  )

  const hasFilters = Object.keys(filters).length > 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Sana oralig'i - boshlang'ich */}
      <div className="grid gap-2">
        <Label>{t('reports.filters.startDate')}</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'justify-start text-left font-normal',
                !filters.startDate && 'text-muted-foreground',
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.startDate
                ? format(new Date(filters.startDate), 'PPP')
                : t('reports.filters.selectDate')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={
                filters.startDate ? new Date(filters.startDate) : undefined
              }
              onSelect={(date: Date | undefined) =>
                onFiltersChange({
                  startDate: date?.toISOString().split('T')[0],
                })
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Sana oralig'i - yakuniy */}
      <div className="grid gap-2">
        <Label>{t('reports.filters.endDate')}</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'justify-start text-left font-normal',
                !filters.endDate && 'text-muted-foreground',
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.endDate
                ? format(new Date(filters.endDate), 'PPP')
                : t('reports.filters.selectDate')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.endDate ? new Date(filters.endDate) : undefined}
              onSelect={(date: Date | undefined) =>
                onFiltersChange({ endDate: date?.toISOString().split('T')[0] })
              }
              initialFocus
              disabled={(date: Date) => {
                if (!filters.startDate) return false
                return date < new Date(filters.startDate)
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Fakultet */}
      <div className="grid gap-2">
        <Label>{t('reports.filters.faculty')}</Label>
        <Select
          value={filters.facultyId}
          onValueChange={(value: string) =>
            onFiltersChange({
              facultyId: value === 'all' ? undefined : value,
              courseId: undefined, // Fakultet o'zgarganda kursni tozalash
            })
          }
          disabled={isLoadingFaculties}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('reports.filters.allFaculties')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('reports.filters.allFaculties')}</SelectItem>
            {faculties?.map((faculty) => (
              <SelectItem key={faculty.id} value={faculty.id}>
                {faculty.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Ta'lim yo'nalishi */}
      <div className="grid gap-2">
        <Label>{t('reports.filters.direction')}</Label>
        <Select
          value={filters.direction}
          onValueChange={(value: string) =>
            onFiltersChange({
              direction: value === 'all' ? undefined : (value as 'BACHELOR' | 'MASTER'),
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={t('reports.filters.allDirections')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('reports.filters.allDirections')}</SelectItem>
            <SelectItem value="BACHELOR">{t('admin.directions.BACHELOR')}</SelectItem>
            <SelectItem value="MASTER">{t('admin.directions.MASTER')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Kurs */}
      <div className="grid gap-2">
        <Label>{t('reports.filters.course')}</Label>
        <Select
          value={filters.courseId}
          onValueChange={(value: string) =>
            onFiltersChange({
              courseId: value === 'all' ? undefined : value,
            })
          }
          disabled={!filters.facultyId || isLoadingCourses}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('reports.filters.allCourses')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('reports.filters.allCourses')}</SelectItem>
            {courses?.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tozalash tugmasi */}
      <div className="flex items-end">
        <Button
          variant="outline"
          size="sm"
          onClick={onClearFilters}
          disabled={!hasFilters}
          className="w-full"
        >
          <X className="h-4 w-4 mr-2" />
          {t('reports.filters.clear')}
        </Button>
      </div>
    </div>
  )
}