// Admin ro'yxatlari uchun yengil, qulay (a11y) filtr select komponenti.
//
// shadcn/ui hozircha Select komponentiga ega emas, shu sababli native
// `<select>` elementidan foydalaniladi — bu klaviatura navigatsiyasi va
// skrinriderlar uchun to'liq qulay. Stillar Input komponentiga moslashtirilgan.

import { cn } from '@/shared/lib/utils'

export interface FilterSelectOption {
  value: string
  label: string
}

interface FilterSelectProps {
  id: string
  label: string
  value: string
  options: FilterSelectOption[]
  /** "Barchasi" optsiyasi matni (bo'sh qiymatga mos keladi). */
  allLabel: string
  onChange: (value: string) => void
  className?: string
}

/**
 * Sarlavhali (label) bitta filtr select. Bo'sh qiymat "barchasi" ni anglatadi.
 */
export function FilterSelect({
  id,
  label,
  value,
  options,
  allLabel,
  onChange,
  className,
}: FilterSelectProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        <option value="">{allLabel}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
