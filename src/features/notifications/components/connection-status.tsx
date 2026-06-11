/**
 * WebSocket connection status indicator
 *
 * Shows current connection status with visual feedback.
 * Requirements: 16.1, 16.5
 */

import { useWebSocketConnection } from '../hooks/use-websocket-connection';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function ConnectionStatus() {
  const { status } = useWebSocketConnection();
  const { t } = useTranslation();

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-success" aria-hidden="true" />;
      case 'connecting':
        return <Loader2 className="h-4 w-4 text-warning animate-spin" aria-hidden="true" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-destructive" aria-hidden="true" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return t('notifications.status.connected');
      case 'connecting':
        return t('notifications.status.connecting');
      case 'disconnected':
        return t('notifications.status.disconnected');
    }
  };

  return (
    <div className="flex items-center gap-2 text-sm" role="status" aria-live="polite">
      {getStatusIcon()}
      <span className="sr-only">{getStatusText()}</span>
    </div>
  );
}