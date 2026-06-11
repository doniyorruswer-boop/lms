// Bildirishnoma global holati: bildirishnomalar ro'yxati va o'qilmaganlar soni.
// Zustand 4 yordamida saqlanadi. Requirements: 16.2.
//
// Invariant (design.md Property 22): har qanday `add`/`markRead` ketma-ketligidan
// keyin `unreadCount` doimo `items.filter((i) => !i.read).length` ga teng bo'lishi kerak.
// Buni ta'minlash uchun `unreadCount` har bir mutatsiyada `items` dan qayta hisoblanadi.
import { create } from "zustand";
import type { AppNotification } from "../types";

// O'qilmagan bildirishnomalar sonini ro'yxatdan hisoblovchi yagona manba.
function computeUnreadCount(items: AppNotification[]): number {
  return items.filter((item) => !item.read).length;
}

export interface NotificationState {
  // Barcha bildirishnomalar (eng yangisi birinchi).
  items: AppNotification[];
  // O'qilmagan bildirishnomalar soni (items dan hosil qilingan).
  unreadCount: number;

  // Yangi bildirishnomani ro'yxat boshiga qo'shish.
  add: (notification: AppNotification) => void;
  // Berilgan id bo'yicha bildirishnomani o'qilgan deb belgilash.
  markRead: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  items: [],
  unreadCount: 0,

  add: (notification) =>
    set((state) => {
      const items = [notification, ...state.items];
      return { items, unreadCount: computeUnreadCount(items) };
    }),

  markRead: (id) =>
    set((state) => {
      const items = state.items.map((item) =>
        item.id === id ? { ...item, read: true } : item,
      );
      return { items, unreadCount: computeUnreadCount(items) };
    }),
}));
