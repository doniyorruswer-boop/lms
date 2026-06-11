/**
 * Main notification manager component
 *
 * Manages WebSocket connection, toasts, and notification panel.
 * Requirements: 16.1, 16.2, 16.3, 16.4
 */

import { useState } from 'react';
import { NotificationBell } from './notification-bell';
import { NotificationList } from './notification-list';
import { ConnectionStatus } from './connection-status';
import { useWebSocketConnection } from '../hooks/use-websocket-connection';
import { useNotificationToasts } from '../hooks/use-notification-toasts';

export function NotificationManager() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  
  // Initialize WebSocket connection and toasts
  useWebSocketConnection();
  useNotificationToasts();

  return (
    <div className="flex items-center gap-2">
      <ConnectionStatus />
      <NotificationBell onOpenPanel={() => setIsPanelOpen(true)} />
      <NotificationList 
        isOpen={isPanelOpen} 
        onClose={() => setIsPanelOpen(false)} 
      />
    </div>
  );
}