// Bildirishnoma
export interface AppNotification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  link: string | null;
}
