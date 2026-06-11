// Yengil, kutubxonasiz gorizontal ustun diagrammasi (Req 13.2, 13.4).
//
// Tashqi diagramma kutubxonasiga bog'liqlikni oldini olish uchun oddiy,
// foydalanish imkoniyatli (accessible) ustunlar `div` kengligi orqali
// chiziladi. Har bir ustun `progressbar` roli bilan belgilanadi, shunda
// skrinrider qiymatni o'qiy oladi.

import { cn } from '@/shared/lib/utils'

/** Diagrammaning bitta ustuni. */
export interface BarChartDatum {
  /** Ustun yorlig'i (masalan, OTM nomi). */
  label: string
  /** Ustun qiymati (manfiy bo'lmagan). */
  value: number
  /** Ko'rsatiladigan qiymat matni (formatlangan). Berilmasa `value` ishlatiladi. */
  displayValue?: string
  /** `true` bo'lsa ustun ogohlantirish (qizil) rangida chiziladi. */
  highlight?: boolean
}

interface BarChartProps {
  data: readonly BarChartDatum[]
  /** Diagrammaning ARIA tavsifi. */
  ariaLabel: string
  className?: string
}

/**
 * Gorizontal ustun diagrammasi. Ustun kengligi maksimal qiymatga nisbatan
 * normallashtiriladi.
 */
export function BarChart({ data, ariaLabel, className }: BarChartProps) {
  const maxValue = data.reduce((max, d) => Math.max(max, d.value), 0)

  return (
    <ul className={cn('space-y-2', className)} aria-label={ariaLabel}>
      {data.map((datum, index) => {
        const widthPercent =
          maxValue > 0 ? Math.round((datum.value / maxValue) * 100) : 0
        return (
          <li key={`${datum.label}-${index}`} className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate">{datum.label}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {datum.displayValue ?? datum.value}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded bg-muted">
              <div
                role="progressbar"
                aria-valuenow={datum.value}
                aria-valuemin={0}
                aria-valuemax={maxValue}
                aria-label={datum.label}
                className={cn(
                  'h-full rounded transition-all',
                  datum.highlight ? 'bg-destructive' : 'bg-primary'
                )}
                style={{ width: `${widthPercent}%` }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
