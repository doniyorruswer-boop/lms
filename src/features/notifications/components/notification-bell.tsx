/**
 * Notification bell icon with unread count badge
 *
 * Shows notification count and opens notification panel when clicked.
 * Requirements: 16.2, 16.3
 */

import { Bell } from 'lucide-react';
import { Button } from '../../../shared/ui/button';
import { useNotificationStore } from '../../../shared/store/notification-store';
import { useTranslation } from 'react-i18next';

interface NotificationBellProps {
  onOpenPanel: () => void;
}

export function NotificationBell({ onOpenPanel }: NotificationBellProps) {
  const { t } = useTranslation();
  const { unreadCount } = useNotificationStore();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="relative"
      onClick={onOpenPanel}
      aria-label={t('notifications.bell.aria', { count: unreadCount })}
    >
      <Bell className="h-5 w-5" aria-hidden="true" />
      {unreadCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-xs font-medium text-destructive-foreground flex items-center justify-center"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Button>
  );
}