// Admin foydalanuvchilar ro'yxati sahifasi (Req 11.1).
//
// Foydalanuvchilar backend-dan sahifalash (pagination) bilan yuklanadi va
// jadval ko'rinishida (F.I.Sh., rol, OTM, fakultet, holat) ko'rsatiladi. Rol,
// OTM, fakultet va holat bo'yicha filtrlar joriy sahifa ustida `filterUsers`
// toza funksiyasi orqali qo'llanadi (Req 11.1). Rol va holat filtrlari sobit
// ro'yxatlardan, OTM va fakultet filtrlari esa yuklangan ma'lumotdagi mavjud
// qiymatlardan (`distinct`) hosil qilinadi. Yuklanishda skeleton, xatoda
// "Qayta urinish" tugmasi ko'rsatiladi. Barcha matnlar `react-i18next` orqali
// tarjima qilinadi.

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle } from 'lucide-react'

import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'

import { ADMIN_USERS_PAGE_SIZE, useAdminUsers } from '../api/use-admin-users'
import { distinct, filterUsers } from '../lib/filters'
import {
  EMPTY_USER_FILTERS,
  USER_ROLES,
  USER_STATUSES,
  type UserFilters,
} from '../types'
import { FilterSelect, type FilterSelectOption } from './filter-select'

/** Yuklanish paytida ko'rsatiladigan jadval skeletoni. */
function UsersSkeleton() {
  const { t } = useTranslation()
  return (
    <div
      className="space-y-3"
      role="status"
      aria-busy="true"
      aria-label={t('common.loading')}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="h-12 w-full animate-pulse rounded bg-muted" />
      ))}
    </div>
  )
}

interface UsersErrorProps {
  onRetry: () => void
}

/** Backend xatosida ko'rsatiladigan xato holati va "Qayta urinish". */
function UsersError({ onRetry }: UsersErrorProps) {
  const { t } = useTranslation()
  return (
    <Card role="alert" className="border-destructive">
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <AlertCircle className="size-5 text-destructive" aria-hidden="true" />
        <CardTitle className="text-lg text-destructive">
          {t('admin.users.errorTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t('admin.users.errorDescription')}
        </p>
        <Button onClick={onRetry} variant="outline">
          {t('admin.users.retry')}
        </Button>
      </CardContent>
    </Card>
  )
}

/**
 * Admin foydalanuvchilar ro'yxatining asosiy komponenti (Req 11.1).
 */
export function AdminUsers() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<UserFilters>(EMPTY_USER_FILTERS)

  const { data, isLoading, isError, isPlaceholderData, refetch } = useAdminUsers(
    page,
    ADMIN_USERS_PAGE_SIZE,
  )

  const items = useMemo(() => data?.items ?? [], [data?.items])
  const visibleUsers = useMemo(
    () => filterUsers(items, filters),
    [items, filters],
  )

  // OTM va fakultet filtrlari joriy sahifadagi mavjud qiymatlardan
  // (takrorlanmagan) hosil qilinadi.
  const otmOptions = useMemo<FilterSelectOption[]>(() => {
    const ids = distinct(items.map((u) => u.otmId))
    return ids.map((id) => ({
      value: id,
      label: items.find((u) => u.otmId === id)?.otmName ?? id,
    }))
  }, [items])

  const facultyOptions = useMemo<FilterSelectOption[]>(() => {
    const ids = distinct(items.map((u) => u.facultyId))
    return ids.map((id) => ({
      value: id,
      label: items.find((u) => u.facultyId === id)?.facultyName ?? id,
    }))
  }, [items])

  const roleOptions = useMemo<FilterSelectOption[]>(
    () =>
      USER_ROLES.map((role) => ({
        value: role,
        label: t(`admin.roles.${role}`),
      })),
    [t],
  )

  const statusOptions = useMemo<FilterSelectOption[]>(
    () =>
      USER_STATUSES.map((status) => ({
        value: status,
        label: t(`admin.statuses.${status}`),
      })),
    [t],
  )

  const total = data?.total ?? 0
  const pageSize = data?.pageSize ?? ADMIN_USERS_PAGE_SIZE
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const canGoPrev = page > 1
  const canGoNext = page < totalPages

  function updateFilter<K extends keyof UserFilters>(
    key: K,
    value: UserFilters[K],
  ) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <main className="space-y-6 p-6" aria-labelledby="admin-users-title">
      <h1 id="admin-users-title" className="text-2xl font-bold">
        {t('admin.users.title')}
      </h1>

      {/* Filtrlar (Req 11.1) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FilterSelect
          id="users-filter-role"
          label={t('admin.users.filters.role')}
          value={filters.role ?? ''}
          options={roleOptions}
          allLabel={t('admin.filters.all')}
          onChange={(v) => updateFilter('role', v as UserFilters['role'])}
        />
        <FilterSelect
          id="users-filter-otm"
          label={t('admin.users.filters.otm')}
          value={filters.otmId ?? ''}
          options={otmOptions}
          allLabel={t('admin.filters.all')}
          onChange={(v) => updateFilter('otmId', v)}
        />
        <FilterSelect
          id="users-filter-faculty"
          label={t('admin.users.filters.faculty')}
          value={filters.facultyId ?? ''}
          options={facultyOptions}
          allLabel={t('admin.filters.all')}
          onChange={(v) => updateFilter('facultyId', v)}
        />
        <FilterSelect
          id="users-filter-status"
          label={t('admin.users.filters.status')}
          value={filters.status ?? ''}
          options={statusOptions}
          allLabel={t('admin.filters.all')}
          onChange={(v) => updateFilter('status', v as UserFilters['status'])}
        />
      </div>

      {isLoading ? (
        <UsersSkeleton />
      ) : isError || !data ? (
        <UsersError onRetry={() => void refetch()} />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.users.columns.name')}</TableHead>
                <TableHead>{t('admin.users.columns.role')}</TableHead>
                <TableHead>{t('admin.users.columns.otm')}</TableHead>
                <TableHead>{t('admin.users.columns.faculty')}</TableHead>
                <TableHead>{t('admin.users.columns.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground"
                  >
                    {t('admin.users.empty')}
                  </TableCell>
                </TableRow>
              ) : (
                visibleUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.fullName}
                    </TableCell>
                    <TableCell>{t(`admin.roles.${user.role}`)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.otmName ?? '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.facultyName ?? '—'}
                    </TableCell>
                    <TableCell>{t(`admin.statuses.${user.status}`)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Sahifalash boshqaruvi (Req 11.1) */}
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {t('admin.pageInfo', { current: page, total: totalPages })}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!canGoPrev || isPlaceholderData}
              >
                {t('buttons.back')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!canGoNext || isPlaceholderData}
              >
                {t('buttons.next')}
              </Button>
            </div>
          </div>
        </>
      )}
    </main>
  )
}

export default AdminUsers
