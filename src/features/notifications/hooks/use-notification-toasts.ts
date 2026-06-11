/**
 * Hook for showing toast notifications when new notifications arrive
 *
 * Automatically displays toast for new notifications and increments unread count.
 * Requirements: 16.2
 */

import { useEffect, useRef } from 'react';
import { useNotificationStore } from '../../../shared/store/notification-store';
import { toast } from '../../../shared/ui/use-toast';
import { useTranslation } from 'react-i18next';

export function useNotificationToasts() {
  const { t } = useTranslation();
  const { items } = useNotificationStore();
  const previousItemsCount = useRef(items.length);

  useEffect(() => {
    // Check if new notifications were added
    if (items.length > previousItemsCount.current) {
      const newNotifications = items.slice(0, items.length - previousItemsCount.current);
      
      // Show toast for each new notification
      newNotifications.forEach((notification) => {
        if (!notification.read) {
          toast({
            title: notification.title,
            description: notification.body,
            duration: 5000, // Show for 5 seconds
          });
        }
      });
    }

    previousItemsCount.current = items.length;
  }, [items, t]);
}