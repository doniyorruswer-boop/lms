/**
 * Notification list panel component
 *
 * Shows list of notifications with read/unread status and mark as read functionality.
 * Requirements: 16.3, 16.4
 */

import { useNotificationStore } from '../../../shared/store/notification-store';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../shared/ui/button';
import { Card } from '../../../shared/ui/card';
// Using div with overflow for scrolling instead of ScrollArea component
import { X, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { uz, ru, enUS } from 'date-fns/locale';
import { useUiStore } from '../../../shared/store/ui-store';
import { useNavigate } from 'react-router-dom';

interface NotificationListProps {
  isOpen: boolean;
  onClose: () => void;
}

const localeMap = {
  uz: uz,
  ru: ru,
  en: enUS,
} as const;

export function NotificationList({ isOpen, onClose }: NotificationListProps) {
  const { t } = useTranslation();
  const { locale } = useUiStore();
  const { items, markRead } = useNotificationStore();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleNotificationClick = (id: string, link?: string | null) => {
    markRead(id);
    if (link) {
      navigate(link);
    }
    onClose();
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return formatDistanceToNow(date, { 
        addSuffix: true, 
        locale: localeMap[locale] 
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} aria-hidden="true">
      <div
        className="absolute right-4 top-16 w-80 max-h-96 bg-popover text-popover-foreground rounded-lg shadow-lg border border-border"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t('notifications.title')}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-lg">
            {t('notifications.title')}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        {/* Notification list */}
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {t('notifications.empty')}
            </div>
          ) : (
            <div className="p-2">
              {items.map((notification) => (
                <Card
                  key={notification.id}
                  role="button"
                  tabIndex={0}
                  className={`p-3 mb-2 cursor-pointer transition-colors hover:bg-muted/50 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    !notification.read ? 'border-l-4 border-l-primary' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification.id, notification.link)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleNotificationClick(notification.id, notification.link);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-sm truncate ${
                          !notification.read ? 'font-semibold' : 'font-medium'
                        }`}>
                          {notification.title}
                        </h4>
                        {notification.link && (
                          <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {notification.body}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatRelativeTime(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" aria-hidden="true" />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-3 border-t border-border text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                items.forEach(item => !item.read && markRead(item.id));
              }}
              disabled={items.every(item => item.read)}
            >
              {t('notifications.markAllRead')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}