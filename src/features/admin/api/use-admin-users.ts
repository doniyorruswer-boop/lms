// Admin foydalanuvchilar ro'yxatini React Query 5 orqali yuklovchi hook
// (Req 11.1).
//
// Ro'yxat backend-dan sahifalash (pagination) bilan yuklanadi. Rol, OTM,
// fakultet va holat bo'yicha filtrlar mijoz tomonida joriy sahifa ustida
// `filterUsers` toza funksiyasi orqali qo'llanadi (komponentda). Bir sahifadan
// boshqasiga o'tishda oldingi ma'lumot saqlanadi (`keepPreviousData`) — shunday
// qilib jadval "miltillamaydi" va `isPlaceholderData` orqali tugmalarni
// bloklash mumkin.

import {
  keepPreviousData,
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query'

import { apiClient } from '@/shared/api/client'
import { endpoints } from '@/shared/api/endpoints'
import type { Paginated } from '@/shared/types'

import type { AdminUser } from '../types'

/** Sahifalash uchun sahifa o'lchami. */
export const ADMIN_USERS_PAGE_SIZE = 20

/** React Query kesh kaliti — sahifalangan foydalanuvchilar ro'yxati. */
export function adminUsersQueryKey(page: number, pageSize: number) {
  return ['admin', 'users', { page, pageSize }] as const
}

async function fetchAdminUsers(
  page: number,
  pageSize: number,
): Promise<Paginated<AdminUser>> {
  const res = await apiClient.get<Paginated<AdminUser>>(endpoints.users.list, {
    params: { page, pageSize },
  })
  return res.data
}

/**
 * Sahifalangan admin foydalanuvchilar ro'yxatini yuklaydigan hook (Req 11.1).
 */
export function useAdminUsers(
  page: number = 1,
  pageSize: number = ADMIN_USERS_PAGE_SIZE,
): UseQueryResult<Paginated<AdminUser>> {
  return useQuery({
    queryKey: adminUsersQueryKey(page, pageSize),
    queryFn: () => fetchAdminUsers(page, pageSize),
    placeholderData: keepPreviousData,
  })
}
